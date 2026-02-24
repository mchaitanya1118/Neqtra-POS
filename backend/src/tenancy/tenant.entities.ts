import { Category } from '../entities/category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { Table } from '../entities/table.entity';
import { Menu } from '../menu/entities/menu.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderEvent } from '../orders/entities/order-event.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Customer } from '../customers/entities/customer.entity';
import { DuesPayment } from '../customers/entities/dues-payment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Delivery } from '../delivery/entities/delivery.entity';

// Entities that belong inside the Tenant's isolated database
export const TenantEntities = [
    Category,
    MenuItem,
    Table,
    Menu,
    Order,
    OrderItem,
    OrderEvent,
    Expense,
    InventoryItem,
    Notification,
    Reservation,
    Customer,
    DuesPayment,
    Payment,
    Delivery
];
