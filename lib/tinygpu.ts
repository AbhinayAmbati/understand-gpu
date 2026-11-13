/** A tiny GPU: several cores that share one program counter and run the same
 *  program in lock-step, each on its own data. */

export const NUM_CORES = 4;
export const REGION = ["A", "B", "C"] as const;
export const REGION_SIZE = 4;

export type Instr =
  | { op: "TID"; rd: number }
  | { op: "LOAD"; rd: number; region: number; rs: number }
  | { op: "STORE"; region: number; rs: number; rv: number }
  | { op: "ADD" | "MUL"; rd: number; ra: number; rb: number }
  | { op: "ADDI"; rd: number; ra: number; imm: number }
  | { op: "DONE" };

export type Program = { name: string; goal: string; code: Instr[] };

export const PROGRAMS: Program[] = [
  {
    name: "Add two lists",
    goal: "C[i] = A[i] + B[i]",
    code: [
      { op: "TID", rd: 0 },
      { op: "LOAD", rd: 1, region: 0, rs: 0 },
      { op: "LOAD", rd: 2, region: 1, rs: 0 },
      { op: "ADD", rd: 3, ra: 1, rb: 2 },
      { op: "STORE", region: 2, rs: 0, rv: 3 },
      { op: "DONE" },
    ],
  },
  {
    name: "Multiply, then add 10",
    goal: "C[i] = A[i] × B[i] + 10",
    code: [
      { op: "TID", rd: 0 },
      { op: "LOAD", rd: 1, region: 0, rs: 0 },
      { op: "LOAD", rd: 2, region: 1, rs: 0 },
      { op: "MUL", rd: 3, ra: 1, rb: 2 },
      { op: "ADDI", rd: 3, ra: 3, imm: 10 },
      { op: "STORE", region: 2, rs: 0, rv: 3 },
      { op: "DONE" },
    ],
  },
];

export type Phase = "fetch" | "decode" | "execute";

export type SimState = {
  pc: number;
  phase: Phase;
  done: boolean;
  /** regs[core][r] */
  regs: number[][];
  mem: number[];
  /** register each core wrote during the last execute */
  wroteReg: (number | null)[];
  /** memory cell each core touched during the last execute */
  memAccess: ({ addr: number; kind: "read" | "write" } | null)[];
};

export function initState(a: number[], b: number[]): SimState {
  return {
    pc: 0,
    phase: "fetch",
    done: false,
    regs: Array.from({ length: NUM_CORES }, () => [0, 0, 0, 0]),
    mem: [...a, ...b, 0, 0, 0, 0],
    wroteReg: Array(NUM_CORES).fill(null),
    memAccess: Array(NUM_CORES).fill(null),
  };
}

export function step(s: SimState, program: Program): SimState {
  if (s.done) return s;
  const blank = {
    wroteReg: Array(NUM_CORES).fill(null),
    memAccess: Array(NUM_CORES).fill(null),
  };
  if (s.phase === "fetch") return { ...s, ...blank, phase: "decode" };
  if (s.phase === "execute") return { ...s, ...blank, phase: "fetch", pc: s.pc + 1 };

  // decode -> execute: every core performs the same instruction on its own registers
  const ins = program.code[s.pc];
  const regs = s.regs.map((r) => [...r]);
  const mem = [...s.mem];
  const wroteReg: (number | null)[] = Array(NUM_CORES).fill(null);
  const memAccess: SimState["memAccess"] = Array(NUM_CORES).fill(null);

  for (let c = 0; c < NUM_CORES; c++) {
    const r = regs[c];
    switch (ins.op) {
      case "TID":
        r[ins.rd] = c;
        wroteReg[c] = ins.rd;
        break;
      case "LOAD": {
        const addr = ins.region * REGION_SIZE + r[ins.rs];
        r[ins.rd] = mem[addr];
        wroteReg[c] = ins.rd;
        memAccess[c] = { addr, kind: "read" };
        break;
      }
      case "STORE": {
        const addr = ins.region * REGION_SIZE + r[ins.rs];
        mem[addr] = r[ins.rv];
        memAccess[c] = { addr, kind: "write" };
        break;
      }
      case "ADD":
        r[ins.rd] = r[ins.ra] + r[ins.rb];
        wroteReg[c] = ins.rd;
        break;
      case "MUL":
        r[ins.rd] = r[ins.ra] * r[ins.rb];
        wroteReg[c] = ins.rd;
        break;
      case "ADDI":
        r[ins.rd] = r[ins.ra] + ins.imm;
        wroteReg[c] = ins.rd;
        break;
      case "DONE":
        break;
    }
  }
  return { ...s, phase: "execute", regs, mem, wroteReg, memAccess, done: ins.op === "DONE" };
}

export function asm(ins: Instr): string {
  switch (ins.op) {
    case "TID":
      return `TID   R${ins.rd}`;
    case "LOAD":
      return `LOAD  R${ins.rd}, ${REGION[ins.region]}[R${ins.rs}]`;
    case "STORE":
      return `STORE ${REGION[ins.region]}[R${ins.rs}], R${ins.rv}`;
    case "ADD":
      return `ADD   R${ins.rd}, R${ins.ra}, R${ins.rb}`;
    case "MUL":
      return `MUL   R${ins.rd}, R${ins.ra}, R${ins.rb}`;
    case "ADDI":
      return `ADDI  R${ins.rd}, R${ins.ra}, ${ins.imm}`;
    case "DONE":
      return "DONE";
  }
}

export function meaning(ins: Instr): string {
  switch (ins.op) {
    case "TID":
      return `Put this core's own number (0, 1, 2 or 3) into R${ins.rd}. This is how identical cores end up working on different data.`;
    case "LOAD":
      return `Read list ${REGION[ins.region]} from memory, at the position held in R${ins.rs}, and put the value in R${ins.rd}.`;
    case "STORE":
      return `Write the value in R${ins.rv} into list ${REGION[ins.region]} in memory, at the position held in R${ins.rs}.`;
    case "ADD":
      return `Add R${ins.ra} and R${ins.rb}, and put the answer in R${ins.rd}.`;
    case "MUL":
      return `Multiply R${ins.ra} by R${ins.rb}, and put the answer in R${ins.rd}.`;
    case "ADDI":
      return `Add the fixed number ${ins.imm} to R${ins.ra}, and put the answer in R${ins.rd}.`;
    case "DONE":
      return "The program is finished. The cores stop and wait for the next job.";
  }
}

export function narrate(s: SimState, program: Program): string {
  const ins = program.code[s.pc];
  if (s.done) {
    return "Finished. All four results are in list C, and each was computed by a different core at the same moment. A real GPU does exactly this with thousands of cores.";
  }
  if (s.phase === "fetch") {
    return `FETCH: all four cores read line ${s.pc} of the program at the same time. They share a single program counter, which is what keeps each core small and cheap.`;
  }
  if (s.phase === "decode") {
    return `DECODE: the control circuit works out what “${asm(ins).replace(/\s+/g, " ")}” means. ${meaning(ins)}`;
  }
  if (ins.op === "LOAD" || ins.op === "STORE") {
    return `EXECUTE: same instruction, different data. Each core has a different number in R${ins.rs}, so each one ${ins.op === "LOAD" ? "reads" : "writes"} a different memory cell (see the coloured outlines below).`;
  }
  if (ins.op === "TID") {
    return "EXECUTE: each core now holds its own number in R0. From here on, the same program does something different on every core.";
  }
  return "EXECUTE: every core's arithmetic unit does the calculation at once, each on its own register values. Four answers in the time of one.";
}
