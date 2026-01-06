declare module '@discordjs/opus' {
	export class OpusEncoder {
		public constructor(rate: number, channels: number);
		public encode(buf: Buffer): Buffer;
		/**
		 * Decodes the given Opus buffer to PCM signed 16-bit little-endian
		 * @param buf Opus buffer
		 */
		public decode(buf: Buffer): Buffer;
		public applyEncoderCTL(ctl: number, value: number): void;
		public applyDecoderCTL(ctl: number, value: number): void;
		public setBitrate(bitrate: number): void;
		public getBitrate(): number;
	}
}
