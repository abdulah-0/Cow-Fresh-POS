import { createClient } from '@/lib/supabase/client'
import { Sale } from '@/types'

interface CompanyInfo {
    name: string
    address?: string
    phone?: string
    email?: string
    taxId?: string
}

/**
 * Get company information from app_config
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('app_config')
            .select('key, value')
            .in('key', ['company_name', 'company_address', 'company_phone', 'company_email', 'tax_id'])

        if (error) throw error

        const config: Record<string, string> = {}
        data?.forEach((item) => {
            config[item.key] = item.value
        })

        return {
            name: config.company_name || 'POS System',
            address: config.company_address,
            phone: config.company_phone,
            email: config.company_email,
            taxId: config.tax_id,
        }
    } catch (error) {
        console.error('Error fetching company info:', error)
        return {
            name: 'POS System',
        }
    }
}

/**
 * Generate receipt HTML for printing
 */
export function generateReceiptHTML(sale: Sale, companyInfo: CompanyInfo, logoUrl?: string): string {
    const saleDate = new Date(sale.sale_time).toLocaleString()

    // Calculate totals
    const subtotal = sale.items?.reduce((sum, item) => {
        const qty = item.quantity ?? item.quantity_purchased ?? 0
        const itemTotal = item.item_unit_price * qty
        const discount = itemTotal * (item.discount_percent / 100)
        return sum + (itemTotal - discount)
    }, 0) || 0

    const total = subtotal

    const totalPaid = sale.payments?.reduce((sum, p) => sum + p.payment_amount, 0) || 0
    const change = totalPaid - total

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Receipt - ${sale.invoice_number}</title>
            <style>
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
                body {
                    font-family: 'Courier New', monospace;
                    max-width: 300px;
                    margin: 20px auto;
                    padding: 20px;
                    font-size: 12px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px dashed #000;
                    padding-bottom: 10px;
                }
                .logo-container {
                    margin-bottom: 10px;
                }
                .logo {
                    max-width: 120px;
                    height: auto;
                }
                .company-name {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .company-info {
                    font-size: 10px;
                    line-height: 1.4;
                }
                .sale-info {
                    margin: 15px 0;
                    font-size: 11px;
                }
                .items {
                    margin: 15px 0;
                    border-top: 1px dashed #000;
                    border-bottom: 1px dashed #000;
                    padding: 10px 0;
                }
                .item {
                    margin: 8px 0;
                }
                .item-name {
                    font-weight: bold;
                }
                .item-details {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                }
                .totals {
                    margin: 15px 0;
                }
                .total-line {
                    display: flex;
                    justify-content: space-between;
                    margin: 5px 0;
                }
                .total-line.grand-total {
                    font-size: 14px;
                    font-weight: bold;
                    border-top: 2px solid #000;
                    padding-top: 8px;
                    margin-top: 8px;
                }
                .payments {
                    margin: 15px 0;
                    border-top: 1px dashed #000;
                    padding-top: 10px;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    border-top: 2px dashed #000;
                    padding-top: 10px;
                    font-size: 11px;
                }
                .print-button {
                    display: block;
                    margin: 20px auto;
                    padding: 10px 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .print-button:hover {
                    background: #45a049;
                }
            </style>
        </head>
        <body>
            <button class="print-button no-print" onclick="window.print()">🖨️ Print Receipt</button>
            
            <div class="header">
                ${logoUrl ? `
                    <div class="logo-container">
                        <img src="${logoUrl}" alt="Cow Fresh Logo" class="logo" />
                    </div>
                ` : ''}
                <div class="company-name">${companyInfo.name}</div>
                <div class="company-info">
                    ${companyInfo.address ? `${companyInfo.address}<br>` : ''}
                    ${companyInfo.phone ? `Tel: ${companyInfo.phone}<br>` : ''}
                    ${companyInfo.email ? `Email: ${companyInfo.email}<br>` : ''}
                    ${companyInfo.taxId ? `Tax ID: ${companyInfo.taxId}` : ''}
                </div>
            </div>
            
            <div class="sale-info">
                <div><strong>Invoice:</strong> ${sale.invoice_number}</div>
                <div><strong>Date:</strong> ${saleDate}</div>
                ${sale.customer ? `<div><strong>Customer:</strong> ${sale.customer.person?.first_name} ${sale.customer.person?.last_name}</div>` : ''}
            </div>
            
            <div class="items">
                ${sale.items?.map(item => {
                    const qty = item.quantity ?? item.quantity_purchased ?? 0
                    return `
                        <div class="item">
                            <div class="item-name">${item.item?.name || 'Item'}</div>
                            <div class="item-details">
                                <span>${qty} x Rs. ${item.item_unit_price.toFixed(2)}</span>
                                <span>Rs. ${(item.item_unit_price * qty).toFixed(2)}</span>
                            </div>
                            ${item.discount_percent > 0 ? `
                                <div class="item-details">
                                    <span>Discount (${item.discount_percent}%)</span>
                                    <span>-Rs. ${((item.item_unit_price * qty * item.discount_percent) / 100).toFixed(2)}</span>
                                </div>
                            ` : ''}
                        </div>
                    `
                }).join('') || ''}
            </div>
            
            <div class="totals">
                <div class="total-line">
                    <span>Subtotal:</span>
                    <span>Rs. ${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-line grand-total">
                    <span>TOTAL:</span>
                    <span>Rs. ${total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="payments">
                <div><strong>Payments:</strong></div>
                ${sale.payments?.map(payment => `
                    <div class="total-line">
                        <span>${payment.payment_type.toUpperCase()}:</span>
                        <span>Rs. ${payment.payment_amount.toFixed(2)}</span>
                    </div>
                `).join('') || ''}
                ${change > 0 ? `
                    <div class="total-line" style="margin-top: 8px;">
                        <span><strong>CHANGE:</strong></span>
                        <span><strong>Rs. ${change.toFixed(2)}</strong></span>
                    </div>
                ` : ''}
            </div>
            
            <div class="footer">
                <div>Thank you for your business!</div>
                <div style="margin-top: 5px;">Please come again</div>
            </div>
        </body>
        </html>
    `
}

/**
 * Print receipt in a new window
 */
export async function printReceipt(saleId: number): Promise<void> {
    const supabase = createClient()

    // Fetch complete sale data
    const { data: sale, error } = await supabase
        .from('sales')
        .select(`
            *,
            customer:customers(
                *,
                person:people(*)
            ),
            items:sales_items(
                *,
                item:items(name)
            ),
            payments:sales_payments(*)
        `)
        .eq('id', saleId)
        .single()

    if (error || !sale) {
        console.error('Error fetching sale:', error)
        throw new Error('Failed to fetch sale data')
    }

    const companyInfo = await getCompanyInfo()
    const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/CF-logo.png` : undefined
    const html = generateReceiptHTML(sale as Sale, companyInfo, logoUrl)

    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()

        // Wait for content to load before printing
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print()
            }, 250)
        }
    }
}

/**
 * Download receipt as HTML file
 */
export function downloadReceipt(sale: Sale, companyInfo: CompanyInfo): void {
    const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/CF-logo.png` : undefined
    const html = generateReceiptHTML(sale, companyInfo, logoUrl)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${sale.invoice_number}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
