import { z } from "zod";

const shortText = z.string().max(128);
const textPairSchema = z.object({
  original: z.string().max(2000),
  modern: z.string().max(4000),
}).strict();

const yaoCiSchema = z.object({
  position: z.number().int().min(1).max(6),
  label: shortText,
  original: z.string().max(2000),
  modern: z.string().max(4000),
}).strict();

const hexagramSchema = z.object({
  id: z.number().int().min(1).max(64),
  name: shortText,
  shortName: shortText,
  upperTrigram: shortText,
  lowerTrigram: shortText,
  binaryPattern: z.number().int().min(0).max(63),
  palace: shortText,
  palaceElement: shortText,
  shiYaoPosition: z.number().int().min(1).max(6),
  yingYaoPosition: z.number().int().min(1).max(6),
  upperYaoWuXing: z.array(shortText).length(3),
  lowerYaoWuXing: z.array(shortText).length(3),
  guaCi: textPairSchema,
  yaoCi: z.array(yaoCiSchema).length(6),
  element: shortText,
}).strict();

const ganzhiSchema = z.object({
  lunarDate: shortText,
  yearPillar: shortText,
  monthPillar: shortText,
  dayPillar: shortText,
  hourPillar: shortText,
  yearGan: shortText,
  yearZhi: shortText,
  monthGan: shortText,
  monthZhi: shortText,
  dayGan: shortText,
  dayZhi: shortText,
  hourGan: shortText,
  hourZhi: shortText,
  solarTerm: shortText,
  gregorianDate: shortText,
  trueSolarDate: shortText,
}).strict();

const yaoDetailSchema = z.object({
  position: z.number().int().min(1).max(6),
  value: z.union([z.literal(6), z.literal(7), z.literal(8), z.literal(9)]),
  yinYang: z.enum(["yin", "yang"]),
  label: shortText,
  isMoving: z.boolean(),
  wuXing: shortText,
  liuQin: shortText,
}).strict();

export const paipanResultSchema = z.object({
  title: z.string().max(256),
  gender: z.enum(["男", "女"]),
  ganzhi: ganzhiSchema,
  shenSha: z.array(z.object({
    name: shortText,
    value: shortText,
    description: z.string().max(1000),
  }).strict()).max(64),
  kongWang: shortText,
  baseHexagram: hexagramSchema,
  changedHexagram: hexagramSchema.nullable(),
  movingYaoPositions: z.array(z.number().int().min(1).max(6)).max(6),
  yaoDetails: z.array(yaoDetailSchema).length(6),
}).strict();

const interpretationSchema = z.object({
  perspectives: z.array(z.object({
    name: z.string().max(64),
    content: z.string().max(20000),
    temperature: z.number().min(0).max(2),
  }).strict()).max(4),
  synthesis: z.string().max(30000),
  timestamp: z.number().int().nonnegative(),
}).strict();

export const interpretRequestSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  gender: z.enum(["男", "女"]),
  paipan: paipanResultSchema,
}).strict();

export const archiveRecordSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{6,64}$/),
  timestamp: z.number().int().nonnegative(),
  question: z.string().trim().min(1).max(1000),
  gender: z.enum(["男", "女"]),
  paipan: paipanResultSchema,
  interpret: interpretationSchema.nullable(),
}).strict();

export type ValidArchiveRecord = z.infer<typeof archiveRecordSchema>;
