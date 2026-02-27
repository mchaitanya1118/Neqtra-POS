// ESC/POS Commands
export const ESC = 0x1b;
export const GS = 0x1d;

export class EscPosEncoder {
    private buffer: number[] = [];

    // Common commands
    initialize() {
        this.buffer.push(ESC, 0x40);
        return this;
    }

    alignLeft() {
        this.buffer.push(ESC, 0x61, 0x00);
        return this;
    }

    alignCenter() {
        this.buffer.push(ESC, 0x61, 0x01);
        return this;
    }

    alignRight() {
        this.buffer.push(ESC, 0x61, 0x02);
        return this;
    }

    bold(on: boolean) {
        this.buffer.push(ESC, 0x45, on ? 0x01 : 0x00);
        return this;
    }

    size(width: number, height: number) {
        // width and height can be 0-7 (1x to 8x)
        const sizeByte = (width << 4) | height;
        this.buffer.push(GS, 0x21, sizeByte);
        return this;
    }

    text(str: string) {
        for (let i = 0; i < str.length; i++) {
            this.buffer.push(str.charCodeAt(i) & 0xFF); // Simple ASCII encoding
        }
        return this;
    }

    newline() {
        this.buffer.push(0x0A);
        return this;
    }

    line(str: string) {
        this.text(str);
        this.newline();
        return this;
    }

    separator(char: string = '-') {
        // 32 chars for 58mm printer. Adjust if configuring for 80mm (usually 48 chars).
        this.line(char.repeat(32));
        return this;
    }

    feed(lines: number = 3) {
        this.buffer.push(ESC, 0x64, lines);
        return this;
    }

    cut() {
        // Paper cut, GS V 0
        this.buffer.push(GS, 0x56, 0x00);
        return this;
    }

    encode(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}

// Helpers for specific print jobs
export function formatCurrency(amount: number) {
    return 'Rs' + amount.toFixed(2);
}

// Format a row with left text and right text padded with spaces in between
export function formatRow(left: string, right: string, width: number = 32) {
    const spaceLength = width - left.length - right.length;
    if (spaceLength > 0) {
        return left + ' '.repeat(spaceLength) + right;
    } else {
        // If it's too long, just put a space 
        return left + ' ' + right;
    }
}

export function formatItemRow(name: string, qty: number, price: number, total: number, width: number = 32) {
    const qtyPrice = `${qty}x${price}`;
    const left = `${name} (${qtyPrice})`;
    const right = formatCurrency(total);
    return formatRow(left, right, width);
}

export function generateBillReceipt(order: any, tenantName: string = "Neqtra POS") {
    const encoder = new EscPosEncoder();

    encoder.initialize()
        .alignCenter()
        .bold(true)
        .size(1, 1) // Double size
        .line(tenantName)
        .size(0, 0) // Normal size
        .bold(false)
        .newline()
        .line(`Order ID: #${order.id}`)
        .line(`Table: ${order.tableName || 'Delivery'}`)
        .line(`Date: ${new Date().toLocaleString()}`)
        .separator()
        .alignLeft()
        .bold(true)
        .line(formatRow("Item", "Total"))
        .bold(false)
        .separator();

    let subTotal = 0;
    order.items?.forEach((item: any) => {
        const title = item.menuItem?.title || item.title || "Unknown Item";
        const price = item.menuItem?.price || item.price || 0;
        const itemTotal = price * item.quantity;
        subTotal += itemTotal;
        encoder.line(formatItemRow(title, item.quantity, price, itemTotal));
    });

    encoder.separator()
        .alignRight();

    if (order.discount > 0) {
        let discountVal = order.discountType === 'PERCENT'
            ? subTotal * (order.discount / 100)
            : order.discount;

        encoder.line(formatRow("Subtotal:", formatCurrency(subTotal)))
            .line(formatRow(`Discount (${order.discount}${order.discountType === 'PERCENT' ? '%' : 'Rs'}):`, `-${formatCurrency(discountVal)}`));
        subTotal -= discountVal;
    }

    const taxAmount = subTotal * 0.10; // Assuming 10% tax. Update this appropriately if dynamic.
    const grandTotal = subTotal + taxAmount;

    encoder.line(formatRow("Tax (10%):", formatCurrency(taxAmount)))
        .separator()
        .bold(true)
        .size(0, 1) // Double height
        .line(formatRow("TOTAL:", formatCurrency(grandTotal)))
        .size(0, 0)
        .bold(false)
        .newline()
        .alignCenter()
        .line("Thank you for your visit!")
        .feed(4)
        .cut();

    return encoder.encode();
}

export function generateKOTReceipt(order: any, isUpdate = false) {
    const encoder = new EscPosEncoder();

    encoder.initialize()
        .alignCenter()
        .bold(true)
        .size(1, 1) // Double size
        .line(isUpdate ? "KOT (UPDATE)" : "KOT (NEW)")
        .size(0, 0) // Normal size
        .bold(false)
        .newline()
        .alignLeft()
        .line(`Order ID: #${order.id}`)
        .line(`Table: ${order.tableName || 'Delivery'}`)
        .line(`Time: ${new Date().toLocaleTimeString()}`)
        .separator()
        .bold(true)
        .line(formatRow("Qty", "Item", 32))
        .bold(false)
        .separator();

    order.items?.forEach((item: any) => {
        // Only print un-served items on KOT update
        if (item.status === 'PENDING' || !item.status) {
            const title = item.menuItem?.title || item.title || "Unknown Item";
            const row = formatRow(`${item.quantity}x`, title, 32);
            // KOT items are usually printed larger
            encoder.size(0, 1).line(row).size(0, 0);

            if (item.notes) {
                encoder.line(`  Note: ${item.notes}`);
            }
        }
    });

    encoder.feed(4)
        .cut();

    return encoder.encode();
}
