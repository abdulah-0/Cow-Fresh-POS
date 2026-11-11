/**
 * templates.ts
 * Message templates for Green API WhatsApp notifications:
 * - Delivery Confirmation (with customer details, goods total, rider info, and time)
 * - POS Digital Receipt
 * - Payment Reminder
 */

import { DeliveryNotificationData } from './types'

export interface ReceiptTemplateData {
    orderNo: string | number
    currency?: string
    total: number | string
    itemsSummary?: string
    customerName?: string
}

export interface PaymentReminderTemplateData {
    balance: number | string
    currency?: string
    customerName?: string
}

export const WHATSAPP_TEMPLATES = {
    deliveryUpdate: (data: DeliveryNotificationData) => {
        const orderLine = data.orderNo ? `Order #${data.orderNo}` : 'Your Delivery'
        const items = data.itemsSummary ? `\n📦 *Goods Delivered:* ${data.itemsSummary}` : ''
        const amount = data.totalAmount ? `\n💰 *Total Amount:* PKR ${data.totalAmount}` : ''
        const rider = data.riderName ? `\n🛵 *Rider:* ${data.riderName}${data.riderPhone ? ` (${data.riderPhone})` : ''}` : ''
        const time = data.deliveryTime ? `\n🕒 *Delivered At:* ${data.deliveryTime}` : ''
        const address = data.deliveryAddress ? `\n📍 *Address:* ${data.deliveryAddress}` : ''

        return `🥛 *Cow Fresh - Delivery Confirmation* 🥛\n\n` +
            `Dear *${data.customerName || 'Valued Customer'}*,\n` +
            `${orderLine} has been successfully delivered!\n` +
            `📱 *Phone:* ${data.customerPhone}` +
            `${items}` +
            `${amount}` +
            `${rider}` +
            `${time}` +
            `${address}\n\n` +
            `Thank you for choosing Cow Fresh Dairy! For any assistance, reply to this message.`
    },

    receipt: (data: ReceiptTemplateData) => {
        const currency = data.currency || 'PKR'
        const items = data.itemsSummary ? `\n📦 Items: ${data.itemsSummary}` : ''
        const greeting = data.customerName ? `Dear *${data.customerName}*,\n` : ''

        return `🥛 *Cow Fresh Dairy - Sales Receipt* 🥛\n\n` +
            `${greeting}` +
            `🧾 *Order #${data.orderNo}*\n` +
            `💰 *Total:* ${currency} ${data.total}` +
            `${items}\n\n` +
            `Thank you for shopping with us!`
    },

    paymentReminder: (data: PaymentReminderTemplateData) => {
        const currency = data.currency || 'PKR'
        const greeting = data.customerName ? `Dear *${data.customerName}*,\n` : ''

        return `🥛 *Cow Fresh Dairy - Payment Reminder* 🥛\n\n` +
            `${greeting}` +
            `A friendly reminder that a balance of *${currency} ${data.balance}* is due on your account.\n\n` +
            `Please clear at your earliest convenience or contact us if you have any questions.`
    },

    text: (text: string) => text,
}

/**
 * Builds the text body from an outbox/input payload.
 */
export function renderTemplateMessage(kind: string, payload: Record<string, any>): string {
    if (payload.text) {
        return payload.text
    }

    switch (kind) {
        case 'delivery_update':
            return WHATSAPP_TEMPLATES.deliveryUpdate({
                customerName: payload.customer_name || payload.customerName || 'Customer',
                customerPhone: payload.customer_phone || payload.customerPhone || '',
                orderNo: payload.order_number || payload.orderNo,
                itemsSummary: payload.items_summary || payload.itemsSummary,
                totalAmount: payload.total || payload.totalAmount,
                riderName: payload.rider_name || payload.riderName,
                riderPhone: payload.rider_phone || payload.riderPhone,
                deliveryTime: payload.delivery_time || payload.deliveryTime || new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
                deliveryAddress: payload.delivery_address || payload.deliveryAddress,
            })

        case 'receipt':
            return WHATSAPP_TEMPLATES.receipt({
                orderNo: payload.order_number || payload.order_no || payload.invoice_number || 'N/A',
                currency: payload.currency || 'PKR',
                total: payload.total || payload.amount || '0',
                itemsSummary: payload.items_summary || payload.itemsSummary,
                customerName: payload.customer_name || payload.customerName,
            })

        case 'payment_reminder':
            return WHATSAPP_TEMPLATES.paymentReminder({
                balance: payload.balance || payload.total || '0',
                currency: payload.currency || 'PKR',
                customerName: payload.customer_name || payload.customerName,
            })

        default:
            return payload.body || payload.message || 'Notification from Cow Fresh Dairy.'
    }
}
