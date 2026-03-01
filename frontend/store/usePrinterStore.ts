import { create } from 'zustand';

interface PrinterState {
    device: BluetoothDevice | null;
    server: BluetoothRemoteGATTServer | null;
    characteristic: BluetoothRemoteGATTCharacteristic | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;

    connect: () => Promise<void>;
    disconnect: () => void;
    print: (data: Uint8Array) => Promise<void>;
}

export const usePrinterStore = create<PrinterState>((set, get) => ({
    device: null,
    server: null,
    characteristic: null,
    isConnected: false,
    isConnecting: false,
    error: null,

    connect: async () => {
        set({ isConnecting: true, error: null });
        try {
            if (!navigator.bluetooth) {
                throw new Error("Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera on a supported OS (Windows, macOS, Android). Note: iOS explicitly blocks Web Bluetooth.");
            }

            let device: BluetoothDevice;
            try {
                device = await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: [
                        '000018f0-0000-1000-8000-00805f9b34fb', // Standard printing service
                        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Vendor-specific printer
                        '0000fee7-0000-1000-8000-00805f9b34fb', // Often used by generic Chinese printers
                        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // iOS SPP substitute (sometimes on BLE printers)
                    ]
                });
            } catch (err: any) {
                if (err.message && err.message.includes('Unsupported device')) {
                    // Fallback 1: Try with fewer services or no optional services if browser allows 
                    // (Chrome requires optionalServices to access them later, but some generic Chinese printers 
                    // fail the initial request if ANY of the UUIDs are deemed 'unsupported' by Chrome's blocklist).
                    // We will do a generic fallback with just the most common vendor-specific one to bypass the block.
                    console.warn("Retrying without extended UUIDs due to Unsupported Device error...");
                    try {
                        device = await navigator.bluetooth.requestDevice({
                            acceptAllDevices: true,
                            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
                        });
                    } catch (err2: any) {
                        if (err2.message && err2.message.includes('Unsupported device')) {
                            console.warn("Retrying with NO optional services as last resort...");
                            device = await navigator.bluetooth.requestDevice({
                                acceptAllDevices: true
                            });
                        } else {
                            throw err2;
                        }
                    }
                } else {
                    throw err;
                }
            }

            device.addEventListener('gattserverdisconnected', () => {
                set({ isConnected: false, device: null, server: null, characteristic: null });
            });

            let server: BluetoothRemoteGATTServer | null = null;
            let retries = 3;
            while (retries > 0) {
                try {
                    server = await device.gatt?.connect() || null;
                    if (server) break;
                } catch (err: any) {
                    console.warn(`GATT connection failed, retries left: ${retries - 1}`, err);
                    retries--;
                    if (retries === 0) throw err;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s before retry
                }
            }
            if (!server) throw new Error("Could not connect to GATT Server after multiple attempts.");

            const services = await server.getPrimaryServices();
            if (services.length === 0) throw new Error("No services found on this device.");

            let printChar: BluetoothRemoteGATTCharacteristic | null = null;

            // Search for a writable characteristic, prioritizing writeWithoutResponse
            for (const service of services) {
                try {
                    const characteristics = await service.getCharacteristics();
                    let fallbackChar: BluetoothRemoteGATTCharacteristic | null = null;

                    for (const char of characteristics) {
                        if (char.properties.writeWithoutResponse) {
                            printChar = char;
                            break; // Found the best one, stop searching this service
                        }
                        if (char.properties.write) {
                            fallbackChar = char;
                        }
                    }
                    if (!printChar && fallbackChar) {
                        printChar = fallbackChar;
                    }
                } catch (e) {
                    console.warn("Error reading characteristics for service", service.uuid, e);
                }
                if (printChar) break; // Break out of services loop once we found a char
            }

            if (!printChar) {
                throw new Error("Could not find a writable characteristic on this printer. It might not be a standard ESC/POS BLE printer.");
            }

            set({
                device,
                server,
                characteristic: printChar,
                isConnected: true,
                isConnecting: false,
                error: null
            });

        } catch (error: any) {
            console.error("Bluetooth connection error:", error);

            let errorMessage = error.message || "Failed to connect to printer.";

            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

            if (isIOS && !navigator.bluetooth) {
                errorMessage = "iOS Safari does not support Bluetooth. Please use the 'Browser Print' button in the preview or use an Android/Windows/macOS device.";
            } else if (!navigator.bluetooth) {
                errorMessage = "Web Bluetooth is not supported in this browser. Please use Chrome/Edge on Android, Windows, or macOS.";
            } else if (errorMessage.includes("NetworkError: Connection attempt failed") || errorMessage.includes("Connection attempt failed")) {
                errorMessage = "Connection attempt failed. Ensure the printer is on and NOT paired to your phone's OS settings.";
            } else if (errorMessage.includes("User cancelled") || errorMessage.includes("cancelled")) {
                errorMessage = "Connection cancelled.";
            } else if (errorMessage.includes("Unsupported device")) {
                errorMessage = "Unsupported device. Please select a compatible Bluetooth Thermal Printer. Disconnect from regular OS Bluetooth first.";
            }

            set({
                isConnecting: false,
                error: errorMessage
            });
        }
    },

    disconnect: () => {
        const { device } = get();
        if (device && device.gatt?.connected) {
            device.gatt.disconnect();
        }
        set({
            device: null,
            server: null,
            characteristic: null,
            isConnected: false,
            isConnecting: false,
            error: null
        });
    },

    print: async (data: Uint8Array) => {
        let { characteristic, isConnected, device, server } = get();
        if (!isConnected || !characteristic || !device) {
            throw new Error("Printer is not connected. Please connect the printer first.");
        }

        // If GATT server has dropped, attempt to reconnect
        if (!server?.connected) {
            console.warn("GATT server disconnected, attempting to reconnect...");
            try {
                const reconnected = await device.gatt?.connect();
                if (!reconnected) throw new Error("Reconnect failed");

                // Re-acquire the services and characteristic
                const services = await reconnected.getPrimaryServices();
                let printChar: BluetoothRemoteGATTCharacteristic | null = null;
                for (const service of services) {
                    try {
                        const chars = await service.getCharacteristics();
                        for (const c of chars) {
                            if (c.properties.writeWithoutResponse || c.properties.write) {
                                printChar = c;
                                break;
                            }
                        }
                    } catch (_) { }
                    if (printChar) break;
                }

                if (!printChar) throw new Error("Could not re-acquire printer characteristic after reconnect.");

                set({ server: reconnected, characteristic: printChar, isConnected: true });
                characteristic = printChar;
                console.log("Printer reconnected successfully.");
            } catch (reconnectErr: any) {
                set({ isConnected: false, server: null, characteristic: null });
                throw new Error(`Printer disconnected and reconnect failed: ${reconnectErr.message}. Please reconnect the printer manually.`);
            }
        }

        // Use 20-byte chunks — the safest MTU for all BLE thermal printers
        const CHUNK_SIZE = 20;

        try {
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                if (characteristic.properties.writeWithoutResponse) {
                    await characteristic.writeValueWithoutResponse(chunk);
                } else {
                    await characteristic.writeValueWithResponse(chunk);
                }
                // 100ms delay — gives slower printers time to process each chunk
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error: any) {
            console.error("Print failed:", error);
            set({ isConnected: false, server: null, characteristic: null });
            throw new Error(`Printing failed: ${error.message}. The printer connection was lost. Please reconnect and try again.`);
        }
    }
}));
