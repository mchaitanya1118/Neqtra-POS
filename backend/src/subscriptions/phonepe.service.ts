import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PhonePeService {
    private readonly logger = new Logger(PhonePeService.name);
    private readonly merchantId: string;
    private readonly saltKey: string;
    private readonly saltIndex: string;
    private readonly hostUrl: string;

    constructor(private configService: ConfigService) {
        this.merchantId = this.configService.get<string>('PHONEPE_MERCHANT_ID') || 'PGTESTPAYUAT';
        this.saltKey = this.configService.get<string>('PHONEPE_SALT_KEY') || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
        this.saltIndex = this.configService.get<string>('PHONEPE_SALT_INDEX') || '1';
        this.hostUrl = this.configService.get<string>('PHONEPE_HOST_URL') || 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    }

    /**
     * Generates the X-VERIFY checksum for PhonePe requests
     */
    private generateChecksum(payload: string, endpoint: string): string {
        const stringToHash = payload + endpoint + this.saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        return `${sha256}###${this.saltIndex}`;
    }

    async createPayment(params: {
        transactionId: string;
        merchantUserId: string;
        amount: number; // in paise
        callbackUrl: string;
        redirectUrl: string;
        mobileNumber?: string;
    }) {
        const endpoint = '/pg/v1/pay';

        const payload = {
            merchantId: this.merchantId,
            merchantTransactionId: params.transactionId,
            merchantUserId: params.merchantUserId,
            amount: params.amount,
            redirectUrl: params.redirectUrl,
            redirectMode: 'REDIRECT',
            callbackUrl: params.callbackUrl,
            mobileNumber: params.mobileNumber,
            paymentInstrument: {
                type: 'PAY_PAGE',
            },
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const checksum = this.generateChecksum(base64Payload, endpoint);

        try {
            const response = await axios.post(
                `${this.hostUrl}${endpoint}`,
                { request: base64Payload },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': checksum,
                        accept: 'application/json',
                    },
                },
            );

            return response.data;
        } catch (error: any) {
            this.logger.error('PhonePe Payment Initiation Failed', error.response?.data || error.message);
            throw new Error('Failed to initiate PhonePe payment');
        }
    }

    async checkStatus(merchantTransactionId: string) {
        const endpoint = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}`;
        const checksum = this.generateChecksum('', endpoint);

        try {
            const response = await axios.get(`${this.hostUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': this.merchantId,
                    accept: 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            this.logger.error('PhonePe Status Check Failed', error.response?.data || error.message);
            throw new Error('Failed to check PhonePe payment status');
        }
    }
}
