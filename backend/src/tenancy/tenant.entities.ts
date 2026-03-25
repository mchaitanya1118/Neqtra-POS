import { Category } from '../entities/category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemIngredient } from '../entities/menu-item-ingredient.entity';
import { Table } from '../entities/table.entity';
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
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Salary } from '../entities/salary.entity';

// Entities that belong inside the Tenant's isolated database
export const TenantEntities = [
    Category,
    MenuItem,
    MenuItemIngredient,
    Table,
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
    Delivery,
    User,
    Role,
    Branch,
    Salary
];
