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

            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    // Common thermal printer service UUIDs
                    '000018f0-0000-1000-8000-00805f9b34fb',
                    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
                    '0000fee7-0000-1000-8000-00805f9b34fb', // Often used by generic Chinese printers
                    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // iOS SPP substitute (sometimes on BLE printers)
                ]
            });

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

            // Search for a writable characteristic
            for (const service of services) {
                try {
                    const characteristics = await service.getCharacteristics();
                    for (const char of characteristics) {
                        if (char.properties.write || char.properties.writeWithoutResponse) {
                            printChar = char;
                            break;
                        }
                    }
                } catch (e) {
                    console.warn("Error reading characteristics for service", service.uuid, e);
                }
                if (printChar) break;
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

            if (errorMessage.includes("NetworkError: Connection attempt failed") || errorMessage.includes("Connection attempt failed")) {
                errorMessage = "Connection attempt failed. Please ensure the printer is turned on, in range, and NOT currently paired to your device's native OS Bluetooth settings (Web Bluetooth needs exclusive access).";
            } else if (errorMessage.includes("User cancelled") || errorMessage.includes("cancelled")) {
                errorMessage = "Bluetooth pairing was cancelled.";
            } else if (errorMessage.includes("No Services found")) {
                errorMessage = "Connected, but no compatible printing services found. Please ensure this is an ESC/POS BLE printer.";
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
        const { characteristic, isConnected } = get();
        if (!isConnected || !characteristic) {
            throw new Error("Printer is not connected");
        }

        // Print in chunks. BLE typically limits chunks to 20 or 512 bytes depending on the MTU.
        // We use 200 bytes per chunk as a safe ground. a slightly bigger chunk size speeds it up but might be dropped.
        const CHUNK_SIZE = 100;

        try {
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                if (characteristic.properties.writeWithoutResponse) {
                    await characteristic.writeValueWithoutResponse(chunk);
                } else {
                    await characteristic.writeValue(chunk);
                }
                // Small delay to prevent overwhelming the printer's buffer
                await new Promise(resolve => setTimeout(resolve, 20));
            }
        } catch (error: any) {
            console.error("Print failed:", error);
            throw new Error("Printing failed. The connection to the printer might have been lost.");
        }
    }
}));
