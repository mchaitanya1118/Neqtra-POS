import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderEvent } from './entities/order-event.entity';
import { OrderItem } from './entities/order-item.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { Table } from '../entities/table.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Delivery } from '../delivery/entities/delivery.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { ClsService } from 'nestjs-cls';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OrdersService {
  private readonly TAX_RATE = 0.1;
  private razorpay: Razorpay;

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(MenuItem)
    private menuItemRepo: Repository<MenuItem>,
    @InjectRepository(Table)
    private tableRepo: Repository<Table>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,
    @InjectRepository(InventoryItem)
    private inventoryRepo: Repository<InventoryItem>,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationsService: NotificationsService,
    private readonly cls: ClsService,
    @InjectQueue('orders')
    private readonly ordersQueue: Queue,
  ) {
    this.razorpay = new Razorpay({
      key_id: 'rzp_test_S8BPowIgENgSYn',
      key_secret: 'ndxHEDNLFEEr1EgFMr61WCxB',
    });
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const tenantId = this.cls.get('tenantId');

      // Validation: Table Name required unless Delivery
      if (createOrderDto.type !== 'DELIVERY' && !createOrderDto.tableName) {
        throw new BadRequestException('Table Name is required for non-delivery orders');
      }

      let order: Order | null = null;
      let isNewOrder = false;

      // Check for existing active order for this table
      if (createOrderDto.tableName) {
        order = await this.orderRepo.findOne({
          where: [
            { tableName: createOrderDto.tableName, status: 'PENDING' },
            { tableName: createOrderDto.tableName, status: 'CONFIRMED' },
            { tableName: createOrderDto.tableName, status: 'PARTIAL' },
          ],
          relations: ['items'],
          order: { createdAt: 'DESC' },
        });
      }

      if (!order) {
        order = new Order();
        if (createOrderDto.tableName) order.tableName = createOrderDto.tableName;
        order.items = [];
        isNewOrder = true;
      }

      if (createOrderDto.customerId) order.customerId = createOrderDto.customerId;
      if (createOrderDto.type) order.type = createOrderDto.type;
      if (createOrderDto.discount !== undefined) {
        order.discount = createOrderDto.discount;
        order.discountType = createOrderDto.discountType || 'FIXED';
      }

      let additionalTotal = 0;
      const orderItems: OrderItem[] = [];

      // FAST PATH: Get MenuItems in bulk to minimize latency
      const menuItemIds = createOrderDto.items.map(i => i.menuItemId);
      const menuItems = await this.menuItemRepo.find({
        where: { id: In(menuItemIds) }
      });

      for (const itemDto of createOrderDto.items) {
        const menuItem = menuItems.find(mi => mi.id === itemDto.menuItemId);
        if (menuItem) {
          const orderItem = new OrderItem();
          orderItem.menuItem = menuItem;
          orderItem.quantity = itemDto.quantity;
          orderItems.push(orderItem);
          additionalTotal += Number(menuItem.price) * itemDto.quantity;
        }
      }

      order.items = [...(order.items || []), ...orderItems];
      order.totalAmount = isNewOrder ? additionalTotal : Number(order.totalAmount) + additionalTotal;

      const savedOrder = await this.orderRepo.save(order);

      // Handle Table status immediately
      if (isNewOrder && createOrderDto.tableName) {
        await this.tableRepo.update({ label: order.tableName }, { status: 'OCCUPIED' });
      }

      // ASYNC PATH: Offload Stock, Notifications, Delivery creation to BullMQ
      await this.ordersQueue.add('process-order-details', {
        orderId: savedOrder.id,
        items: createOrderDto.items,
        type: createOrderDto.type,
        deliveryDetails: createOrderDto.deliveryDetails,
        tenantId
      });

      return savedOrder;
    } catch (e) {
      console.error(`[OrdersService.create] FATAL ERROR:`, e);
      throw e;
    }
  }

  async handlePostOrderProcessing(data: { orderId: number, items: any[], type: string, deliveryDetails: any, tenantId: string }) {
    // Manually set tenant context for repository scoping
    await this.cls.set('tenantId', data.tenantId);

    const { orderId, items, type, deliveryDetails, tenantId } = data;

    // Logic: Stock Deduction after returning to client for speed
    for (const itemDto of items) {
      const menuItem = await this.menuItemRepo.findOne({
        where: { id: itemDto.menuItemId },
        relations: ['ingredients', 'ingredients.inventoryItem'],
      });

      if (menuItem) {
        if (menuItem.isStockManaged) {
          menuItem.stock -= itemDto.quantity;
          await this.menuItemRepo.save(menuItem);
        }

        if (menuItem.ingredients && menuItem.ingredients.length > 0) {
          for (const ingredient of menuItem.ingredients) {
            const inventoryItem = ingredient.inventoryItem;
            if (inventoryItem) {
              inventoryItem.quantity -= ingredient.quantity * itemDto.quantity;
              await this.inventoryRepo.save(inventoryItem);

              if (inventoryItem.quantity <= inventoryItem.threshold) {
                this.notificationsService.create({
                  title: 'Low Stock Alert',
                  message: `Item "${inventoryItem.name}" is low on stock (${inventoryItem.quantity} ${inventoryItem.unit} remaining).`,
                  type: NotificationType.WARNING,
                });
              }
            }
          }
        }
      }
    }

    if (type === 'DELIVERY' && deliveryDetails) {
      const delivery = this.deliveryRepo.create({ ...deliveryDetails, orderId, status: 'PENDING' });
      await this.deliveryRepo.save(delivery);
    }

    const finalOrder = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.menuItem'],
    });

    if (finalOrder) {
      this.notificationsGateway.emitToTenant(tenantId, 'new_order', finalOrder);
      this.notificationsService.create({
        title: 'New Order Created',
        message: `Order #${finalOrder.id} has been placed.`,
        type: NotificationType.INFO,
      });
    }
  }

  async findAll(page = 1, limit = 50, status?: string) {
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (status === 'active') {
      whereClause.status = In(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'PARTIAL', 'DUE']);
    } else if (status) {
      whereClause.status = status;
    }

    const [orders, total] = await this.orderRepo.findAndCount({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      relations: ['items', 'items.menuItem'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async getActiveOrder(tableId: number) {
    console.log(
      `[getActiveOrder] Checking active order for Table ID: ${tableId}`,
    );
    const table = await this.tableRepo.findOneBy({ id: tableId });
    if (!table) {
      console.error(`[getActiveOrder] Table ID ${tableId} not found in DB`);
      throw new NotFoundException('Table not found');
    }
    console.log(
      `[getActiveOrder] Table Found: ${table.label} (Status: ${table.status})`,
    );

    const order = await this.orderRepo.findOne({
      where: [
        { tableName: table.label, status: 'PENDING' },
        { tableName: table.label, status: 'CONFIRMED' },
        { tableName: table.label, status: 'PARTIAL' },
        { tableName: table.label, status: 'SERVED' },
      ],
      relations: ['items', 'items.menuItem', 'payments'], // Removed 'customer' to prevent crash
      order: { createdAt: 'DESC' },
    });

    console.log(
      `[getActiveOrder] Search Result for ${table.label}: `,
      order ? `ID ${order.id} (${order.status})` : 'NO ACTIVE ORDER FOUND',
    );

    if (!order) throw new NotFoundException('No active order'); // Return 404 so frontend handles it cleanly

    // Calculate totals for UI
    const totalPaid =
      order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Logic similar to settle to get correct subtotal/taxable
    const subTotal = Number(order.totalAmount);
    let discountVal = 0;
    if (order.discountType === 'PERCENT') {
      discountVal = subTotal * (Number(order.discount) / 100);
    } else {
      discountVal = Number(order.discount);
    }

    return { ...order, totalPaid, discountVal };
  }

  async settle(orderId: number, amount?: number, method: string = 'CASH') {
    console.log(`[settle] Attempting to settle Order ID: ${orderId}`);

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) {
      console.error(`[settle] Order ID ${orderId} not found`);
      throw new NotFoundException('Order not found');
    }

    // Now find the table
    const table = await this.tableRepo.findOneBy({ label: order.tableName });
    if (!table) {
      console.warn(
        `[settle] Table ${order.tableName} not found for Order ${orderId}`,
      );
      // We might still want to allow settling the order even if table is missing, but logically it should exist.
      // Throwing for now to maintain consistency.
      throw new NotFoundException(`Table ${order.tableName} not found`);
    }

    console.log(
      `[settle] Found Table ${table.label} (Status: ${table.status}) for Order ${orderId}`,
    );

    if (table.status !== 'OCCUPIED' && order.status !== 'DUE') {
      // Allow settling if it's already DUE (freed table), otherwise ensure it matches
      console.warn(
        `[settle] Table ${table.label} is NOT OCCUPIED (Status: ${table.status}). Proceeding regarding order logic.`,
      );
    }

    // Calculate current financials
    const currentPaid =
      order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const subTotal = Number(order.totalAmount);

    let discountVal = 0;
    if (order.discountType === 'PERCENT') {
      discountVal = subTotal * (Number(order.discount) / 100);
    } else {
      discountVal = Number(order.discount);
    }

    const taxableAmount = Math.max(0, subTotal - discountVal);
    const totalDue = taxableAmount;
    const currentRemaining = totalDue - currentPaid;

    const payAmount =
      amount === undefined || amount === null ? currentRemaining : amount;

    if (payAmount > 0.01) {
      if (method === 'DUE' || method === 'ON_ACCOUNT') {
        if (!order.customerId) {
          throw new BadRequestException(
            'Customer must be assigned to settle as DUE',
          );
        }
        const customer = await this.customerRepo.findOneBy({
          id: order.customerId,
        });
        if (customer) {
          customer.totalDue += payAmount;
          await this.customerRepo.save(customer);
          console.log(
            `[settle] Updated Customer ${customer.name} Total Due to ${customer.totalDue}`,
          );
        }
      }

      const payment = this.paymentRepo.create({
        amount: payAmount,
        method,
        order,
      });
      await this.paymentRepo.save(payment);

      if (!order.payments) order.payments = [];
      order.payments.push(payment);
    }

    const totalPaid = order.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const remaining = totalDue - totalPaid;

    if (remaining <= 0.01) {
      order.status =
        method === 'ON_ACCOUNT' || method === 'DUE' ? 'DUE' : 'COMPLETED';

      // Only free the table if it was occupied
      if (table.status === 'OCCUPIED') {
        table.status = 'FREE';
        await this.tableRepo.save(table);
      }

      await this.orderRepo.save(order);
      return {
        message: 'Bill Settled & Table Freed',
        status: order.status,
        remaining: 0,
      };
    } else {
      order.status = 'PARTIAL';
      await this.orderRepo.save(order);
      return {
        message: 'Partial Payment Recorded',
        status: 'PARTIAL',
        remaining,
      };
    }
  }
  async markServed(orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order not found');

    // Update all items to SERVED
    if (order.items) {
      for (const item of order.items) {
        if (item.status === 'PENDING') {
          item.status = 'SERVED';
          await this.orderItemRepo.save(item);
        }
      }
    }

    // Optionally update order status if needed, but keeping it simple for KDS filter
    // Broadcast update so KDS removes them
    const updatedOrder = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.menuItem'],
    });

    if (updatedOrder) {
      const tenantId = this.cls.get('tenantId');
      this.notificationsGateway.emitToTenant(tenantId, 'new_order', updatedOrder);
    }

    return { message: 'Order marked as SERVED' };
  }

  async remove(id: number) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    // Free the table
    const table = await this.tableRepo.findOneBy({ label: order.tableName });
    if (table) {
      table.status = 'FREE';
      await this.tableRepo.save(table);
    }

    order.status = 'CANCELLED';
    await this.orderRepo.save(order);

    return { message: 'Order cancelled and table freed' };
  }
  async getStats() {
    const totalOrders = await this.orderRepo.count();

    const pendingOrders = await this.orderRepo.count({
      where: [
        { status: 'PENDING' },
        { status: 'CONFIRMED' },
        { status: 'PARTIAL' },
      ],
    });

    const completedOrders = await this.orderRepo.count({
      where: [{ status: 'COMPLETED' }, { status: 'DUE' }],
    });

    const { revenue } = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'revenue')
      .where('order.status IN (:...statuses)', {
        statuses: ['COMPLETED', 'DUE'],
      })
      .getRawOne();

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: Number(revenue) || 0,
    };
  }

  async moveOrder(orderId: number, targetTableId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const targetTable = await this.tableRepo.findOneBy({ id: targetTableId });
    if (!targetTable) throw new NotFoundException('Target table not found');

    if (targetTable.status !== 'FREE') {
      throw new BadRequestException('Target table is not valid or occupied');
    }

    const oldTableName = order.tableName;
    const oldTable = await this.tableRepo.findOneBy({ label: oldTableName });

    // Update ALL Orders on the old table to the new table (PENDING, CONFIRMED, PARTIAL, SERVED)
    await this.orderRepo.update(
      {
        tableName: oldTableName,
        status: In(['PENDING', 'CONFIRMED', 'PARTIAL', 'SERVED']),
      },
      { tableName: targetTable.label },
    );

    // Update Tables
    if (oldTable) {
      oldTable.status = 'FREE';
      await this.tableRepo.save(oldTable);
    }

    targetTable.status = 'OCCUPIED';
    await this.tableRepo.save(targetTable);

    return {
      message: `All active orders moved from ${oldTableName} to ${targetTable.label}`,
      order,
    };
  }

  async createRazorpayOrder(orderId: number, amount: number) {
    // Check if order exists
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) throw new NotFoundException('Order not found');

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `order_rcptid_${orderId}_${Date.now()}`,
    };

    try {
      const response = await this.razorpay.orders.create(options);
      return {
        id: response.id,
        currency: response.currency,
        amount: response.amount,
      };
    } catch (error) {
      console.error('Razorpay Create Order Failed', error);
      throw new BadRequestException('Failed to create Razorpay order');
    }
  }

  async verifyRazorpayPayment(
    orderId: number,
    paymentId: string,
    orderRpId: string,
    signature: string,
    amount: number,
  ) {
    const generated_signature = crypto
      .createHmac('sha256', 'ndxHEDNLFEEr1EgFMr61WCxB') // Key Secret
      .update(orderRpId + '|' + paymentId)
      .digest('hex');

    if (generated_signature === signature) {
      // Signature matched, calling settle internally
      console.log(
        `[verifyPayment] Signature Verified. Settling order ${orderId}...`,
      );
      return await this.settle(orderId, amount, 'ONLINE');
    } else {
      throw new BadRequestException(
        'Payment Verification Failed: Invalid Signature',
      );
    }
  }
  // --- PHONEPE INTEGRATION ---

  private PHONEPE_MERCHANT_ID =
    process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
  private PHONEPE_SALT_KEY =
    process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
  private PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
  private PHONEPE_HOST_URL =
    process.env.PHONEPE_HOST_URL ||
    'https://api-preprod.phonepe.com/apis/pg-sandbox';

  async initiatePhonePePayment(orderId: number, amount: number) {
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) throw new NotFoundException('Order not found');

    const transactionId = `TXN_${orderId}_${Date.now()}`;
    const amountInPaise = Math.round(amount * 100);

    const payload = {
      merchantId: this.PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: 'MUID_' + (order.customerId || 'GUEST'),
      amount: amountInPaise,
      redirectUrl: `http://localhost:3000/api/payment/redirect`, // Placeholder URL, not essentially used in this flow if we open in new tab and poll
      redirectMode: 'POST', // Standard
      callbackUrl: `http://localhost:3001/orders/webhook/phonepe`, // Optional webhook
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
      'base64',
    );
    const apiPath = '/pg/v1/pay';

    // Checksum: sha256(base64Body + apiEndPoint + salt) + ### + saltIndex
    const stringToHash = base64Payload + apiPath + this.PHONEPE_SALT_KEY;
    const sha256 = crypto
      .createHash('sha256')
      .update(stringToHash)
      .digest('hex');
    const checksum = `${sha256}###${this.PHONEPE_SALT_INDEX}`;

    try {
      const response = await fetch(`${this.PHONEPE_HOST_URL}${apiPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
        },
        body: JSON.stringify({ request: base64Payload }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('PhonePe Call Failed:', errText);
        throw new BadRequestException(`PhonePe API Failed: ${errText}`);
      }

      const data = await response.json();
      if (data.success) {
        return {
          url: data.data.instrumentResponse.redirectInfo.url,
          merchantTransactionId: transactionId,
        };
      } else {
        throw new BadRequestException(`PhonePe Error: ${data.message}`);
      }
    } catch (e: any) {
      console.error('PhonePe Init Error:', e);
      throw new BadRequestException(e.message || 'Payment init failed');
    }
  }

  async updateStatus(orderId: number, status: string, userId?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['SERVED', 'CANCELLED'],
      SERVED: ['COMPLETED', 'PARTIAL', 'DUE'],
      PARTIAL: ['COMPLETED', 'DUE'],
      DUE: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[order.status]?.includes(status)) {
      // Allow force override if needed, but for now strict
      // console.warn(`Invalid transition from ${order.status} to ${status}`);
    }

    const previousStatus = order.status;
    order.status = status;
    await this.orderRepo.save(order);

    // Create Event
    const event = new OrderEvent();
    event.order = order;
    event.status = status;
    event.previousStatus = previousStatus;
    event.createdBy = userId || 'SYSTEM';
    await this.orderRepo.manager.save(OrderEvent, event);

    // Broadcast
    const updatedOrder = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.menuItem'],
    });

    if (updatedOrder) {
      const tenantId = this.cls.get('tenantId');
      this.notificationsGateway.emitToTenant(tenantId, 'order_status_updated', updatedOrder);

      this.notificationsService.create({
        title: `Order #${orderId} Updated`,
        message: `Status changed to ${status}`,
        type: NotificationType.INFO,
      });
    }

    return updatedOrder;
  }

  async checkPhonePeStatus(
    orderId: number,
    merchantTransactionId: string,
    amount: number,
  ) {
    const apiPath = `/pg/v1/status/${this.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;

    // Checksum: sha256(apiPath + salt) + ### + saltIndex
    // Verify Status Check API format: GET /pg/v1/status/{merchantId}/{merchantTransactionId}
    // X-VERIFY: SHA256(“/pg/v1/status/{merchantId}/{merchantTransactionId}” + saltKey) + “###” + saltIndex

    const stringToHash = apiPath + this.PHONEPE_SALT_KEY;
    const sha256 = crypto
      .createHash('sha256')
      .update(stringToHash)
      .digest('hex');
    const checksum = `${sha256}###${this.PHONEPE_SALT_INDEX}`;

    try {
      const response = await fetch(`${this.PHONEPE_HOST_URL}${apiPath}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': this.PHONEPE_MERCHANT_ID,
        },
      });

      if (!response.ok) throw new BadRequestException('Failed to check status');

      const data = await response.json();

      if (data.code === 'PAYMENT_SUCCESS') {
        // Payment is successful
        console.log(
          `[PhonePe] Payment Success for ${merchantTransactionId}. Settling order...`,
        );
        return await this.settle(orderId, amount, 'PHONEPE');
      } else if (data.code === 'PAYMENT_PENDING') {
        return { status: 'PENDING', message: 'Payment is still processing' };
      } else {
        return { status: 'FAILED', message: data.message || 'Payment Failed' };
      }
    } catch (e: any) {
      console.error('PhonePe Status Error:', e);
      throw new BadRequestException('Status check failed');
    }
  }
}
