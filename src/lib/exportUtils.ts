/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string): void {
    if (data.length === 0) {
        console.warn('No data to export')
        return
    }

    // Get headers from first object
    const headers = Object.keys(data[0])

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header]
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`
                }
                return value
            }).join(',')
        )
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Export data to PDF format (simple text-based)
 */
export function exportToPDF(data: any[], filename: string, title: string): void {
    if (data.length === 0) {
        console.warn('No data to export')
        return
    }

    // Create HTML content for PDF
    const headers = Object.keys(data[0])

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4CAF50; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <table>
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>
                            ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">
                <p>Total Records: ${data.length}</p>
            </div>
        </body>
        </html>
    `

    // Open print dialog
    const printWindow = window.open('', '', 'height=600,width=800')
    if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()

        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print()
        }, 250)
    }
}

/**
 * Print report
 */
export function printReport(htmlContent: string, title: string): void {
    const printWindow = window.open('', '', 'height=600,width=800')
    if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()

        setTimeout(() => {
            printWindow.print()
        }, 250)
    }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Format date time
 */
export function formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Export sales data to CSV format
 */
export function exportSalesToCSV(sales: any[], filename: string): void {
    // CSV headers
    const headers = [
        'Invoice Number',
        'Date',
        'Customer',
        'Items Count',
        'Total',
        'Status',
        'Employee'
    ]

    // Convert sales to CSV rows
    const rows = sales.map(sale => {
        const customerName = sale.customer
            ? `${sale.customer.person?.first_name || ''} ${sale.customer.person?.last_name || ''}`.trim()
            : 'Walk-in'

        const employeeName = sale.employee
            ? `${sale.employee.person?.first_name || ''} ${sale.employee.person?.last_name || ''}`.trim()
            : 'N/A'

        return [
            sale.invoice_number || '',
            new Date(sale.sale_time).toLocaleString(),
            customerName,
            sale.items?.length || 0,
            sale.sale_total.toFixed(2),
            sale.sale_status || '',
            employeeName
        ]
    })

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Export sales data to PDF format
 */
export function exportSalesToPDF(sales: any[], filename: string): void {
    const totalSales = sales.reduce((sum, sale) => sum + sale.sale_total, 0)

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Sales Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    font-size: 12px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .header p {
                    margin: 5px 0;
                    color: #666;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th {
                    background-color: #f0f0f0;
                    padding: 10px;
                    text-align: left;
                    border: 1px solid #ddd;
                    font-weight: bold;
                }
                td {
                    padding: 8px;
                    border: 1px solid #ddd;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .text-right {
                    text-align: right;
                }
                .summary {
                    margin-top: 30px;
                    padding: 20px;
                    background-color: #f0f0f0;
                    border-radius: 5px;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                    font-size: 14px;
                }
                .summary-row.total {
                    font-size: 18px;
                    font-weight: bold;
                    border-top: 2px solid #333;
                    padding-top: 10px;
                    margin-top: 10px;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <button class="no-print" onclick="window.print()" style="padding: 10px 20px; margin-bottom: 20px; cursor: pointer;">
                🖨️ Print Report
            </button>

            <div class="header">
                <h1>Sales Report</h1>
                <p>Generated on ${new Date().toLocaleString()}</p>
                <p>Total Sales: ${sales.length}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th class="text-right">Items</th>
                        <th class="text-right">Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${sales.map(sale => {
        const customerName = sale.customer
            ? `${sale.customer.person?.first_name || ''} ${sale.customer.person?.last_name || ''}`.trim()
            : 'Walk-in'

        return `
                            <tr>
                                <td>${sale.invoice_number || 'N/A'}</td>
                                <td>${new Date(sale.sale_time).toLocaleDateString()}</td>
                                <td>${customerName}</td>
                                <td class="text-right">${sale.items?.length || 0}</td>
                                <td class="text-right">Rs. ${sale.sale_total.toFixed(2)}</td>
                                <td>${sale.sale_status || 'N/A'}</td>
                            </tr>
                        `
    }).join('')}
                </tbody>
            </table>

            <div class="summary">
                <div class="summary-row total">
                    <span>TOTAL:</span>
                    <span>Rs. ${totalSales.toFixed(2)}</span>
                </div>
            </div>
        </body>
        </html>
    `

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
    }
}
