import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
@Processor('orders')
export class OrdersProcessor extends WorkerHost {
    private readonly logger = new Logger(OrdersProcessor.name);

    constructor(
        private readonly ordersService: OrdersService,
        private readonly cls: ClsService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing order job: ${job.id} (Type: ${job.name})`);

        // Set tenant context for the duration of this job
        return await this.cls.run(async () => {
            if (job.data.tenantId) {
                this.cls.set('tenantId', job.data.tenantId);
            }

            switch (job.name) {
                case 'process-order-details':
                    return await this.ordersService.handlePostOrderProcessing(job.data);
                default:
                    this.logger.warn(`Unknown job name: ${job.name}`);
            }
        });
    }
}
