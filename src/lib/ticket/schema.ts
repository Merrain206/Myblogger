import { z } from "zod";

const field = z.string().max(256);

export const ticketParseRequestSchema = z.object({
  text: z.string().trim().min(1).max(12000),
}).strict();

export const ticketDataSchema = z.object({
  serial: field,
  gate: field,
  fromStation: field,
  fromPinyin: field,
  toStation: field,
  toPinyin: field,
  trainCode: field,
  dateTime: field,
  carriage: field,
  seatNumber: field,
  berthType: field,
  seatType: field,
  price: field,
  idNumber: field,
  passengerName: field,
  footerInfo: field,
  discountType: field,
  invoiceNo: field,
  electronicTicketNo: field,
  issueDate: field,
}).strict();
