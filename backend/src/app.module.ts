import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { TablesModule } from './tables/tables.module';
import { ReportsModule } from './reports/reports.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ExpensesModule } from './expenses/expenses.module';
import { InventoryModule } from './inventory/inventory.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CustomersModule } from './customers/customers.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { DeliveryModule } from './delivery/delivery.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TenantsModule } from './tenants/tenants.module';
import { BranchesModule } from './branches/branches.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DevicesModule } from './devices/devices.module';
import { SalariesModule } from './salaries/salaries.module';
import { ClsModule } from 'nestjs-cls';
import { TenancyModule } from './tenancy/tenancy.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { BullModule } from '@nestjs/bullmq';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Core entities for the main connection
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Branch } from './branches/entities/branch.entity';
import { Tenant } from './tenants/entities/tenant.entity';
import { Plan } from './tenants/entities/plan.entity';
import { Subscription } from './tenants/entities/subscription.entity';
import { TenantSetting } from './tenants/entities/tenant-setting.entity';
import { SuperAdminAuditLog } from './admin/entities/audit-log.entity';
import { Salary } from './entities/salary.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Device } from './devices/entities/device.entity';
import { Invoice } from './subscriptions/entities/invoice.entity';
import { Category } from './entities/category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { Order } from './orders/entities/order.entity';
import { InventoryItem } from './inventory/entities/inventory.entity';
import { Reservation } from './reservations/entities/reservation.entity';
import { Table } from './entities/table.entity';
import { Customer } from './customers/entities/customer.entity';
import { Payment } from './payments/entities/payment.entity';
import { MenuItemIngredient } from './entities/menu-item-ingredient.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { OrderEvent } from './orders/entities/order-event.entity';
import { Expense } from './expenses/entities/expense.entity';
import { DuesPayment } from './customers/entities/dues-payment.entity';
import { Delivery } from './delivery/entities/delivery.entity';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        }
      })
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          User,
          Role,
          Branch,
          Tenant,
          Plan,
          Subscription,
          TenantSetting,
          SuperAdminAuditLog,
          Salary,
          Notification,
          Device,
          Invoice,
          Category,
          MenuItem,
          Order,
          InventoryItem,
          Reservation,
          Table,
          Customer,
          Payment,
          MenuItemIngredient,
          OrderItem,
          OrderEvent,
          Expense,
          DuesPayment,
          Delivery,
        ],

        synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV !== 'production', // Enable via env var or in dev
      }),
    }),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 3,
    }, {
      name: 'long',
      ttl: 60000,
      limit: 100,
    }]),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        }
      })
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    TenancyModule,
    MenuModule,
    OrdersModule,
    TablesModule,
    ReportsModule,
    ReservationsModule,
    ExpensesModule,
    InventoryModule,
    DashboardModule,
    CustomersModule,
    AuthModule,
    UsersModule,
    RolesModule,
    DeliveryModule,
    NotificationsModule,
    TenantsModule,
    BranchesModule,
    PaymentsModule,
    AdminModule,
    SubscriptionsModule,
    DevicesModule,
    SalariesModule,
    BootstrapModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
