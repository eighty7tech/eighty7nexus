export class ESCPOSPrinter {
  private device: any = null;

  async connect() {
    try {
      if (!(navigator as any).usb) {
        throw new Error("WebUSB API is not supported in this browser.");
      }
      this.device = await (navigator as any).usb.requestDevice({
        filters: [{ classCode: 7 }] // Class 7 is USB Printer
      });
      await this.device.open();
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }
      await this.device.claimInterface(0);
      return true;
    } catch (err) {
      console.error("Failed to connect to printer", err);
      return false;
    }
  }

  async printReceipt(text: string, openDrawer: boolean = true) {
    if (!this.device) throw new Error("Printer not connected");

    const encoder = new TextEncoder();
    const commands: number[] = [];

    // Initialize (ESC @)
    commands.push(0x1B, 0x40);

    // Center alignment
    commands.push(0x1B, 0x61, 0x01);

    // Add text bytes
    const textBytes = encoder.encode(text + "\n\n\n\n");
    for (let i = 0; i < textBytes.length; i++) {
      commands.push(textBytes[i]);
    }

    // Cut Paper (GS V A 0)
    commands.push(0x1D, 0x56, 0x41, 0x00);

    // Open Cash Drawer (ESC p 0 25 250)
    if (openDrawer) {
      commands.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
    }

    const data = new Uint8Array(commands);

    // Find the bulk out endpoint
    let endpointNumber = -1;
    const interfaces = this.device.configuration?.interfaces;
    if (interfaces) {
      const endpoints = interfaces[0].alternate.endpoints;
      const outEndpoint = endpoints.find((e: any) => e.direction === 'out');
      if (outEndpoint) {
        endpointNumber = outEndpoint.endpointNumber;
      }
    }

    if (endpointNumber === -1) {
      throw new Error("No bulk out endpoint found");
    }

    await this.device.transferOut(endpointNumber, data);
  }

  async openDrawer() {
    if (!this.device) throw new Error("Printer not connected");

    const commands: number[] = [0x1B, 0x70, 0x00, 0x19, 0xFA];
    const data = new Uint8Array(commands);

    let endpointNumber = -1;
    const interfaces = this.device.configuration?.interfaces;
    if (interfaces) {
      const endpoints = interfaces[0].alternate.endpoints;
      const outEndpoint = endpoints.find((e: any) => e.direction === 'out');
      if (outEndpoint) {
        endpointNumber = outEndpoint.endpointNumber;
      }
    }

    if (endpointNumber === -1) {
      throw new Error("No bulk out endpoint found");
    }

    await this.device.transferOut(endpointNumber, data);
  }
}
