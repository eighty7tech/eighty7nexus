/**
 * Electronic Weight Scale Driver (Web Serial API)
 * Provides seamless serial communication with electronic retail POS scales
 * (e.g. CAS, Mettler Toledo, Torrey, Dibal, Avery Berkel) for grocery, deli,
 * and bulk items.
 */

export interface ScaleReading {
  weight: number;
  unit: "kg" | "lb" | "g" | "oz";
  isStable: boolean;
  isZero: boolean;
  raw: string;
}

export type ScaleReadingListener = (reading: ScaleReading) => void;

class WeightScaleDriver {
  private port: any = null;
  private reader: any = null;
  private keepReading = false;
  private listeners: Set<ScaleReadingListener> = new Set();
  private lastReading: ScaleReading = {
    weight: 0,
    unit: "kg",
    isStable: true,
    isZero: true,
    raw: "",
  };

  /**
   * Checks whether the Web Serial API is supported in this browser.
   */
  public isSupported(): boolean {
    return typeof navigator !== "undefined" && "serial" in navigator;
  }

  /**
   * Connects to a physical electronic scale via Web Serial API.
   */
  public async connect(baudRate = 9600): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn("Web Serial API is not supported in this browser.");
      return false;
    }

    try {
      // Request serial port from user
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });

      this.keepReading = true;
      this.readLoop();
      return true;
    } catch (error) {
      console.error("Failed to connect to scale:", error);
      return false;
    }
  }

  /**
   * Disconnects from the serial port.
   */
  public async disconnect(): Promise<void> {
    this.keepReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // ignore
      }
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch {
        // ignore
      }
      this.port = null;
    }
  }

  /**
   * Subscribes a callback to live weight readings.
   */
  public onReading(listener: ScaleReadingListener): () => void {
    this.listeners.add(listener);
    // Send immediate snapshot of last reading
    listener(this.lastReading);
    return () => this.listeners.delete(listener);
  }

  /**
   * Gets the most recent scale reading.
   */
  public getReading(): ScaleReading {
    return this.lastReading;
  }

  /**
   * Sends tare command to the electronic scale.
   */
  public async tare(): Promise<void> {
    await this.sendCommand("T\r\n");
  }

  /**
   * Sends zero command to the electronic scale.
   */
  public async zero(): Promise<void> {
    await this.sendCommand("Z\r\n");
  }

  private async sendCommand(cmd: string): Promise<void> {
    if (!this.port || !this.port.writable) return;
    try {
      const encoder = new TextEncoder();
      const writer = this.port.writable.getWriter();
      await writer.write(encoder.encode(cmd));
      writer.releaseLock();
    } catch (err) {
      console.error("Failed to send scale command:", err);
    }
  }

  /**
   * Continuous read loop for incoming serial bytes.
   */
  private async readLoop(): Promise<void> {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = "";

    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split(/[\r\n]+/);
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              this.parseScaleLine(line.trim());
            }
          }
        }
      }
    } catch (err) {
      console.error("Serial read error:", err);
    } finally {
      this.reader.releaseLock();
    }
  }

  /**
   * Parses standard electronic scale ASCII string:
   * Examples:
   *  "ST,GS,+  1.250kg" -> Stable, Gross, 1.250 kg
   *  "US,GS,+  0.840kg" -> Unstable, Gross, 0.840 kg
   *  "W: 0.500 kg"
   */
  private parseScaleLine(line: string): void {
    const isStable = !line.includes("US") && !line.includes("M"); // US=unstable, M=motion
    let unit: "kg" | "lb" | "g" | "oz" = "kg";

    if (line.toLowerCase().includes("lb")) unit = "lb";
    else if (line.toLowerCase().includes("oz")) unit = "oz";
    else if (line.toLowerCase().includes("g") && !line.toLowerCase().includes("kg")) unit = "g";

    // Extract numeric weight
    const match = line.match(/[-+]?\s*\d+(\.\d+)?/);
    if (!match) return;

    const weight = parseFloat(match[0].replace(/\s+/g, ""));
    const isZero = Math.abs(weight) < 0.001;

    this.lastReading = {
      weight,
      unit,
      isStable,
      isZero,
      raw: line,
    };

    // Notify listeners
    this.listeners.forEach((l) => l(this.lastReading));
  }
}

export const weightScaleDriver = new WeightScaleDriver();
