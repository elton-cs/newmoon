// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  // @internal
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  // @internal
  countLength() {
    let current = this;
    let length3 = 0;
    while (current) {
      current = current.tail;
      length3++;
    }
    return length3 - 1;
  }
};
function prepend(element3, tail) {
  return new NonEmpty(element3, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index3) {
    if (index3 < 0 || index3 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index3);
  }
  /** @internal */
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.byteAt()` or `BitArray.rawBuffer` instead.
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    bitArrayPrintDeprecationWarning(
      "buffer",
      "Use BitArray.byteAt() or BitArray.rawBuffer instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.bitSize` or `BitArray.byteSize` instead.
   *
   * @returns {number}
   */
  get length() {
    bitArrayPrintDeprecationWarning(
      "length",
      "Use BitArray.bitSize or BitArray.byteSize instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index3) {
  if (bitOffset === 0) {
    return buffer[index3] ?? 0;
  } else {
    const a = buffer[index3] << bitOffset & 255;
    const b = buffer[index3 + 1] >> 8 - bitOffset;
    return a | b;
  }
}
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name, message) {
  if (isBitArrayDeprecationMessagePrinted[name]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name} property used in JavaScript FFI code. ${message}.`
  );
  isBitArrayDeprecationMessagePrinted[name] = true;
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values3 = [x, y];
  while (values3.length) {
    let a = values3.pop();
    let b = values3.pop();
    if (a === b) continue;
    if (!isObject(a) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a);
    for (let k of keys2(a)) {
      values3.push(get2(a, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c)) return false;
  return a.constructor === b.constructor;
}
function divideFloat(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a / b;
  }
}
function makeError(variant, file, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.file = file;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var None = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root3, shift, hash, key, val, addedLeaf) {
  switch (root3.type) {
    case ARRAY_NODE:
      return assocArray(root3, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root3, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root3, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root3, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size + 1,
      array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: ARRAY_NODE,
        size: root3.size,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root3;
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function assocIndex(root3, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root3.bitmap, bit);
  if ((root3.bitmap & bit) !== 0) {
    const node = root3.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root3.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root3.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root3.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root3.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root3, shift, hash, key, val, addedLeaf) {
  if (hash === root3.hash) {
    const idx = collisionIndexOf(root3, key);
    if (idx !== -1) {
      const entry = root3.array[idx];
      if (entry.v === val) {
        return root3;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size2 = root3.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root3.array, size2, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root3.hash, shift),
      array: [root3]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root3, key) {
  const size2 = root3.array.length;
  for (let i = 0; i < size2; i++) {
    if (isEqual(key, root3.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return findArray(root3, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root3, key);
  }
}
function findArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return void 0;
  }
  return root3.array[idx];
}
function without(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return withoutArray(root3, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root3, key);
  }
}
function withoutArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return root3;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root3;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
  }
  if (n === void 0) {
    if (root3.size <= MIN_ARRAY_NODE) {
      const arr = root3.array;
      const out = new Array(root3.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root3.size - 1,
      array: cloneAndSet(root3.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function withoutIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return root3;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  return root3;
}
function withoutCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return root3;
  }
  if (root3.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root3.hash,
    array: spliceOut(root3.array, idx)
  };
}
function forEach(root3, fn) {
  if (root3 === void 0) {
    return;
  }
  const items = root3.array;
  const size2 = items.length;
  for (let i = 0; i < size2; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root3, size2) {
    this.root = root3;
    this.size = size2;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root3 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root3, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = /* @__PURE__ */ Symbol();

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key, value) {
  return map_insert(key, value, dict2);
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function length_loop(loop$list, loop$count) {
  while (true) {
    let list4 = loop$list;
    let count2 = loop$count;
    if (list4 instanceof Empty) {
      return count2;
    } else {
      let list$1 = list4.tail;
      loop$list = list$1;
      loop$count = count2 + 1;
    }
  }
}
function length(list4) {
  return length_loop(list4, 0);
}
function count_loop(loop$list, loop$predicate, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let predicate = loop$predicate;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return acc;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = predicate(first$1);
      if ($) {
        loop$list = rest$1;
        loop$predicate = predicate;
        loop$acc = acc + 1;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
        loop$acc = acc;
      }
    }
  }
}
function count(list4, predicate) {
  return count_loop(list4, predicate, 0);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function is_empty(list4) {
  return isEqual(list4, toList([]));
}
function first(list4) {
  if (list4 instanceof Empty) {
    return new Error(void 0);
  } else {
    let first$1 = list4.head;
    return new Ok(first$1);
  }
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function index_map_loop(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let index3 = loop$index;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let acc$1 = prepend(fun(first$1, index3), acc);
      loop$list = rest$1;
      loop$fun = fun;
      loop$index = index3 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list4, fun) {
  return index_map_loop(list4, fun, 0, toList([]));
}
function drop(loop$list, loop$n) {
  while (true) {
    let list4 = loop$list;
    let n = loop$n;
    let $ = n <= 0;
    if ($) {
      return list4;
    } else {
      if (list4 instanceof Empty) {
        return toList([]);
      } else {
        let rest$1 = list4.tail;
        loop$list = rest$1;
        loop$n = n - 1;
      }
    }
  }
}
function take_loop(loop$list, loop$n, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let n = loop$n;
    let acc = loop$acc;
    let $ = n <= 0;
    if ($) {
      return reverse(acc);
    } else {
      if (list4 instanceof Empty) {
        return reverse(acc);
      } else {
        let first$1 = list4.head;
        let rest$1 = list4.tail;
        loop$list = rest$1;
        loop$n = n - 1;
        loop$acc = prepend(first$1, acc);
      }
    }
  }
}
function take(list4, n) {
  return take_loop(list4, n, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first2 = loop$first;
    let second = loop$second;
    if (first2 instanceof Empty) {
      return second;
    } else {
      let first$1 = first2.head;
      let rest$1 = first2.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first2, second) {
  return append_loop(reverse(first2), second);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function find2(loop$list, loop$is_desired) {
  while (true) {
    let list4 = loop$list;
    let is_desired = loop$is_desired;
    if (list4 instanceof Empty) {
      return new Error(void 0);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = is_desired(first$1);
      if ($) {
        return new Ok(first$1);
      } else {
        loop$list = rest$1;
        loop$is_desired = is_desired;
      }
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let compare4 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list4 instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = compare4(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending();
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending();
            } else {
              _block$1 = new Descending();
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare4;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22 instanceof Empty) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let ascending1 = sequences2.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(
          ascending1,
          ascending2,
          compare4,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22 instanceof Empty) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let descending1 = sequences2.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(
          descending1,
          descending2,
          compare4,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2 instanceof Empty) {
      return toList([]);
    } else if (direction instanceof Ascending) {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(sequences2, compare4, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Descending();
        loop$compare = compare4;
      }
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(sequence);
      } else {
        let sequences$1 = merge_descending_pairs(sequences2, compare4, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Ascending();
        loop$compare = compare4;
      }
    }
  }
}
function sort(list4, compare4) {
  if (list4 instanceof Empty) {
    return toList([]);
  } else {
    let $ = list4.tail;
    if ($ instanceof Empty) {
      let x = list4.head;
      return toList([x]);
    } else {
      let x = list4.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare4(x, y);
      if ($1 instanceof Lt) {
        _block = new Ascending();
      } else if ($1 instanceof Eq) {
        _block = new Ascending();
      } else {
        _block = new Descending();
      }
      let direction = _block;
      let sequences$1 = sequences(
        rest$1,
        compare4,
        toList([x]),
        direction,
        y,
        toList([])
      );
      return merge_all(sequences$1, new Ascending(), compare4);
    }
  }
}
function range_loop(loop$start, loop$stop, loop$acc) {
  while (true) {
    let start4 = loop$start;
    let stop = loop$stop;
    let acc = loop$acc;
    let $ = compare2(start4, stop);
    if ($ instanceof Lt) {
      loop$start = start4;
      loop$stop = stop - 1;
      loop$acc = prepend(stop, acc);
    } else if ($ instanceof Eq) {
      return prepend(stop, acc);
    } else {
      loop$start = start4;
      loop$stop = stop + 1;
      loop$acc = prepend(stop, acc);
    }
  }
}
function range(start4, stop) {
  return range_loop(start4, stop, toList([]));
}
function shuffle_pair_unwrap_loop(loop$list, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return acc;
    } else {
      let elem_pair = list4.head;
      let enumerable = list4.tail;
      loop$list = enumerable;
      loop$acc = prepend(elem_pair[1], acc);
    }
  }
}
function do_shuffle_by_pair_indexes(list_of_pairs) {
  return sort(
    list_of_pairs,
    (a_pair, b_pair) => {
      return compare(a_pair[0], b_pair[0]);
    }
  );
}
function shuffle(list4) {
  let _pipe = list4;
  let _pipe$1 = fold(
    _pipe,
    toList([]),
    (acc, a) => {
      return prepend([random_uniform(), a], acc);
    }
  );
  let _pipe$2 = do_shuffle_by_pair_indexes(_pipe$1);
  return shuffle_pair_unwrap_loop(_pipe$2, toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function slice(string5, idx, len) {
  let $ = len < 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = string_length(string5) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return string_slice(string5, translated_idx, len);
      }
    } else {
      return string_slice(string5, idx, len);
    }
  }
}
function append2(first2, second) {
  return first2 + second;
}
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string5 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string5;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function join_loop(loop$strings, loop$separator, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let separator = loop$separator;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string5 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$separator = separator;
      loop$accumulator = accumulator + separator + string5;
    }
  }
}
function join(strings, separator) {
  if (strings instanceof Empty) {
    return "";
  } else {
    let first$1 = strings.head;
    let rest = strings.tail;
    return join_loop(rest, separator, first$1);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors instanceof Empty) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function map2(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
function string_length(string5) {
  if (string5 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string5.match(/./gsu).length;
  }
}
var segmenter = void 0;
function graphemes_iterator(string5) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string5)[Symbol.iterator]();
  }
}
function string_slice(string5, idx, len) {
  if (len <= 0 || idx >= string5.length) {
    return "";
  }
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    while (idx-- > 0) {
      iterator.next();
    }
    let result = "";
    while (len-- > 0) {
      const v = iterator.next().value;
      if (v === void 0) {
        break;
      }
      result += v.segment;
    }
    return result;
  } else {
    return string5.match(/./gsu).slice(idx, idx + len).join("");
  }
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function round2(float2) {
  return Math.round(float2);
}
function random_uniform() {
  const random_uniform_result = Math.random();
  if (random_uniform_result === 1) {
    return random_uniform();
  }
  return random_uniform_result;
}
function new_map() {
  return Dict.new();
}
function map_get(map4, key) {
  const value = map4.get(key, NOT_FOUND);
  if (value === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value);
}
function map_insert(key, value, map4) {
  return map4.set(key, value);
}

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function compare(a, b) {
  let $ = a === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = a < b;
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}
function negate(x) {
  return -1 * x;
}
function round(x) {
  let $ = x >= 0;
  if ($) {
    return round2(x);
  } else {
    return 0 - round2(negate(x));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function compare2(a, b) {
  let $ = a === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = a < b;
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}
function min(a, b) {
  let $ = a < b;
  if ($) {
    return a;
  } else {
    return b;
  }
}
function add2(a, b) {
  return a + b;
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function is_ok(result) {
  if (result instanceof Ok) {
    return true;
  } else {
    return false;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$() {
  return new Set2(new_map());
}
function contains(set, member) {
  let _pipe = set.dict;
  let _pipe$1 = map_get(_pipe, member);
  return is_ok(_pipe$1);
}
var token = void 0;
function insert2(set, member) {
  return new Set2(insert(set.dict, member, token));
}

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var EMPTY_DICT = /* @__PURE__ */ Dict.new();
function empty_dict() {
  return EMPTY_DICT;
}
var EMPTY_SET = /* @__PURE__ */ new$();
function empty_set() {
  return EMPTY_SET;
}
var document = globalThis?.document;
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var DOCUMENT_FRAGMENT_NODE = 11;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = /* @__PURE__ */ toList([]);
var option_none = /* @__PURE__ */ new None();

// build/dev/javascript/lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ new Gt();
var LT = /* @__PURE__ */ new Lt();
var EQ = /* @__PURE__ */ new Eq();
function compare3(a, b) {
  if (a.name === b.name) {
    return EQ;
  } else if (a.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// build/dev/javascript/lustre/lustre/vdom/vattr.mjs
var Attribute = class extends CustomType {
  constructor(kind, name, value) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value;
  }
};
var Property = class extends CustomType {
  constructor(kind, name, value) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value;
  }
};
var Event2 = class extends CustomType {
  constructor(kind, name, handler, include, prevent_default, stop_propagation, immediate2, debounce, throttle) {
    super();
    this.kind = kind;
    this.name = name;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.immediate = immediate2;
    this.debounce = debounce;
    this.throttle = throttle;
  }
};
function merge(loop$attributes, loop$merged) {
  while (true) {
    let attributes = loop$attributes;
    let merged = loop$merged;
    if (attributes instanceof Empty) {
      return merged;
    } else {
      let $ = attributes.head;
      if ($ instanceof Attribute) {
        let $1 = $.name;
        if ($1 === "") {
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = merged;
        } else if ($1 === "class") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "class") {
                  let kind = $.kind;
                  let class1 = $2;
                  let rest = $3.tail;
                  let class2 = $4.value;
                  let value = class1 + " " + class2;
                  let attribute$1 = new Attribute(kind, "class", value);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else if ($1 === "style") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "style") {
                  let kind = $.kind;
                  let style1 = $2;
                  let rest = $3.tail;
                  let style2 = $4.value;
                  let value = style1 + ";" + style2;
                  let attribute$1 = new Attribute(kind, "style", value);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else {
          let attribute$1 = $;
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = prepend(attribute$1, merged);
        }
      } else {
        let attribute$1 = $;
        let rest = attributes.tail;
        loop$attributes = rest;
        loop$merged = prepend(attribute$1, merged);
      }
    }
  }
}
function prepare(attributes) {
  if (attributes instanceof Empty) {
    return attributes;
  } else {
    let $ = attributes.tail;
    if ($ instanceof Empty) {
      return attributes;
    } else {
      let _pipe = attributes;
      let _pipe$1 = sort(_pipe, (a, b) => {
        return compare3(b, a);
      });
      return merge(_pipe$1, empty_list);
    }
  }
}
var attribute_kind = 0;
function attribute(name, value) {
  return new Attribute(attribute_kind, name, value);
}
var property_kind = 1;
var event_kind = 2;
function event(name, handler, include, prevent_default, stop_propagation, immediate2, debounce, throttle) {
  return new Event2(
    event_kind,
    name,
    handler,
    include,
    prevent_default,
    stop_propagation,
    immediate2,
    debounce,
    throttle
  );
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute2(name, value) {
  return attribute(name, value);
}
function class$(name) {
  return attribute2("class", name);
}
function style(property3, value) {
  if (property3 === "") {
    return class$("");
  } else if (value === "") {
    return class$("");
  } else {
    return attribute2("style", property3 + ":" + value + ";");
  }
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(synchronous, before_paint2, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint2;
    this.after_paint = after_paint;
  }
};
var empty = /* @__PURE__ */ new Effect(
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([])
);
function none() {
  return empty;
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty2() {
  return null;
}
function get(map4, key) {
  const value = map4?.get(key);
  if (value != null) {
    return new Ok(value);
  } else {
    return new Error(void 0);
  }
}
function insert3(map4, key, value) {
  map4 ??= /* @__PURE__ */ new Map();
  map4.set(key, value);
  return map4;
}
function remove(map4, key) {
  map4?.delete(key);
  return map4;
}

// build/dev/javascript/lustre/lustre/vdom/path.mjs
var Root = class extends CustomType {
};
var Key = class extends CustomType {
  constructor(key, parent) {
    super();
    this.key = key;
    this.parent = parent;
  }
};
var Index = class extends CustomType {
  constructor(index3, parent) {
    super();
    this.index = index3;
    this.parent = parent;
  }
};
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path = loop$path;
    let candidates = loop$candidates;
    if (candidates instanceof Empty) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path, candidate);
      if ($) {
        return true;
      } else {
        loop$path = path;
        loop$candidates = rest;
      }
    }
  }
}
function add3(parent, index3, key) {
  if (key === "") {
    return new Index(index3, parent);
  } else {
    return new Key(key, parent);
  }
}
var root2 = /* @__PURE__ */ new Root();
var separator_index = "\n";
var separator_key = "	";
function do_to_string(loop$path, loop$acc) {
  while (true) {
    let path = loop$path;
    let acc = loop$acc;
    if (path instanceof Root) {
      if (acc instanceof Empty) {
        return "";
      } else {
        let segments = acc.tail;
        return concat2(segments);
      }
    } else if (path instanceof Key) {
      let key = path.key;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(separator_key, prepend(key, acc));
    } else {
      let index3 = path.index;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(
        separator_index,
        prepend(to_string(index3), acc)
      );
    }
  }
}
function to_string2(path) {
  return do_to_string(path, toList([]));
}
function matches(path, candidates) {
  if (candidates instanceof Empty) {
    return false;
  } else {
    return do_matches(to_string2(path), candidates);
  }
}
var separator_event = "\f";
function event2(path, event4) {
  return do_to_string(path, toList([separator_event, event4]));
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
var Fragment = class extends CustomType {
  constructor(kind, key, mapper, children, keyed_children, children_count) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.children = children;
    this.keyed_children = keyed_children;
    this.children_count = children_count;
  }
};
var Element = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.children = children;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Text = class extends CustomType {
  constructor(kind, key, mapper, content) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.content = content;
  }
};
var UnsafeInnerHtml = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag, attributes, inner_html) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.inner_html = inner_html;
  }
};
function is_void_element(tag, namespace) {
  if (namespace === "") {
    if (tag === "area") {
      return true;
    } else if (tag === "base") {
      return true;
    } else if (tag === "br") {
      return true;
    } else if (tag === "col") {
      return true;
    } else if (tag === "embed") {
      return true;
    } else if (tag === "hr") {
      return true;
    } else if (tag === "img") {
      return true;
    } else if (tag === "input") {
      return true;
    } else if (tag === "link") {
      return true;
    } else if (tag === "meta") {
      return true;
    } else if (tag === "param") {
      return true;
    } else if (tag === "source") {
      return true;
    } else if (tag === "track") {
      return true;
    } else if (tag === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function advance(node) {
  if (node instanceof Fragment) {
    let children_count = node.children_count;
    return 1 + children_count;
  } else {
    return 1;
  }
}
var fragment_kind = 0;
function fragment(key, mapper, children, keyed_children, children_count) {
  return new Fragment(
    fragment_kind,
    key,
    mapper,
    children,
    keyed_children,
    children_count
  );
}
var element_kind = 1;
function element(key, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
  return new Element(
    element_kind,
    key,
    mapper,
    namespace,
    tag,
    prepare(attributes),
    children,
    keyed_children,
    self_closing,
    void$ || is_void_element(tag, namespace)
  );
}
var text_kind = 2;
function text(key, mapper, content) {
  return new Text(text_kind, key, mapper, content);
}
var unsafe_inner_html_kind = 3;
function set_fragment_key(loop$key, loop$children, loop$index, loop$new_children, loop$keyed_children) {
  while (true) {
    let key = loop$key;
    let children = loop$children;
    let index3 = loop$index;
    let new_children = loop$new_children;
    let keyed_children = loop$keyed_children;
    if (children instanceof Empty) {
      return [reverse(new_children), keyed_children];
    } else {
      let $ = children.head;
      if ($ instanceof Fragment) {
        let node = $;
        if (node.key === "") {
          let children$1 = children.tail;
          let child_key = key + "::" + to_string(index3);
          let $1 = set_fragment_key(
            child_key,
            node.children,
            0,
            empty_list,
            empty2()
          );
          let node_children = $1[0];
          let node_keyed_children = $1[1];
          let _block;
          let _record = node;
          _block = new Fragment(
            _record.kind,
            _record.key,
            _record.mapper,
            node_children,
            node_keyed_children,
            _record.children_count
          );
          let new_node = _block;
          let new_children$1 = prepend(new_node, new_children);
          let index$1 = index3 + 1;
          loop$key = key;
          loop$children = children$1;
          loop$index = index$1;
          loop$new_children = new_children$1;
          loop$keyed_children = keyed_children;
        } else {
          let node$1 = $;
          if (node$1.key !== "") {
            let children$1 = children.tail;
            let child_key = key + "::" + node$1.key;
            let keyed_node = to_keyed(child_key, node$1);
            let new_children$1 = prepend(keyed_node, new_children);
            let keyed_children$1 = insert3(
              keyed_children,
              child_key,
              keyed_node
            );
            let index$1 = index3 + 1;
            loop$key = key;
            loop$children = children$1;
            loop$index = index$1;
            loop$new_children = new_children$1;
            loop$keyed_children = keyed_children$1;
          } else {
            let node$2 = $;
            let children$1 = children.tail;
            let new_children$1 = prepend(node$2, new_children);
            let index$1 = index3 + 1;
            loop$key = key;
            loop$children = children$1;
            loop$index = index$1;
            loop$new_children = new_children$1;
            loop$keyed_children = keyed_children;
          }
        }
      } else {
        let node = $;
        if (node.key !== "") {
          let children$1 = children.tail;
          let child_key = key + "::" + node.key;
          let keyed_node = to_keyed(child_key, node);
          let new_children$1 = prepend(keyed_node, new_children);
          let keyed_children$1 = insert3(
            keyed_children,
            child_key,
            keyed_node
          );
          let index$1 = index3 + 1;
          loop$key = key;
          loop$children = children$1;
          loop$index = index$1;
          loop$new_children = new_children$1;
          loop$keyed_children = keyed_children$1;
        } else {
          let node$1 = $;
          let children$1 = children.tail;
          let new_children$1 = prepend(node$1, new_children);
          let index$1 = index3 + 1;
          loop$key = key;
          loop$children = children$1;
          loop$index = index$1;
          loop$new_children = new_children$1;
          loop$keyed_children = keyed_children;
        }
      }
    }
  }
}
function to_keyed(key, node) {
  if (node instanceof Fragment) {
    let children = node.children;
    let $ = set_fragment_key(
      key,
      children,
      0,
      empty_list,
      empty2()
    );
    let children$1 = $[0];
    let keyed_children = $[1];
    let _record = node;
    return new Fragment(
      _record.kind,
      key,
      _record.mapper,
      children$1,
      keyed_children,
      _record.children_count
    );
  } else if (node instanceof Element) {
    let _record = node;
    return new Element(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.children,
      _record.keyed_children,
      _record.self_closing,
      _record.void
    );
  } else if (node instanceof Text) {
    let _record = node;
    return new Text(_record.kind, key, _record.mapper, _record.content);
  } else {
    let _record = node;
    return new UnsafeInnerHtml(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.inner_html
    );
  }
}

// build/dev/javascript/lustre/lustre/vdom/patch.mjs
var Patch = class extends CustomType {
  constructor(index3, removed, changes, children) {
    super();
    this.index = index3;
    this.removed = removed;
    this.changes = changes;
    this.children = children;
  }
};
var ReplaceText = class extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
};
var ReplaceInnerHtml = class extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
};
var Update = class extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
};
var Move = class extends CustomType {
  constructor(kind, key, before, count2) {
    super();
    this.kind = kind;
    this.key = key;
    this.before = before;
    this.count = count2;
  }
};
var RemoveKey = class extends CustomType {
  constructor(kind, key, count2) {
    super();
    this.kind = kind;
    this.key = key;
    this.count = count2;
  }
};
var Replace = class extends CustomType {
  constructor(kind, from, count2, with$) {
    super();
    this.kind = kind;
    this.from = from;
    this.count = count2;
    this.with = with$;
  }
};
var Insert = class extends CustomType {
  constructor(kind, children, before) {
    super();
    this.kind = kind;
    this.children = children;
    this.before = before;
  }
};
var Remove = class extends CustomType {
  constructor(kind, from, count2) {
    super();
    this.kind = kind;
    this.from = from;
    this.count = count2;
  }
};
function new$4(index3, removed, changes, children) {
  return new Patch(index3, removed, changes, children);
}
var replace_text_kind = 0;
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
var replace_inner_html_kind = 1;
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
var update_kind = 2;
function update(added, removed) {
  return new Update(update_kind, added, removed);
}
var move_kind = 3;
function move(key, before, count2) {
  return new Move(move_kind, key, before, count2);
}
var remove_key_kind = 4;
function remove_key(key, count2) {
  return new RemoveKey(remove_key_kind, key, count2);
}
var replace_kind = 5;
function replace2(from, count2, with$) {
  return new Replace(replace_kind, from, count2, with$);
}
var insert_kind = 6;
function insert4(children, before) {
  return new Insert(insert_kind, children, before);
}
var remove_kind = 7;
function remove2(from, count2) {
  return new Remove(remove_kind, from, count2);
}

// build/dev/javascript/lustre/lustre/vdom/diff.mjs
var Diff = class extends CustomType {
  constructor(patch, events) {
    super();
    this.patch = patch;
    this.events = events;
  }
};
var AttributeChange = class extends CustomType {
  constructor(added, removed, events) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events;
  }
};
function is_controlled(events, namespace, tag, path) {
  if (tag === "input") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else if (tag === "select") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else if (tag === "textarea") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function diff_attributes(loop$controlled, loop$path, loop$mapper, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path = loop$path;
    let mapper = loop$mapper;
    let events = loop$events;
    let old = loop$old;
    let new$8 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (new$8 instanceof Empty) {
      if (old instanceof Empty) {
        return new AttributeChange(added, removed, events);
      } else {
        let $ = old.head;
        if ($ instanceof Event2) {
          let prev = $;
          let old$1 = old.tail;
          let name = $.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = old$1;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let prev = $;
          let old$1 = old.tail;
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = old$1;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        }
      }
    } else if (old instanceof Empty) {
      let $ = new$8.head;
      if ($ instanceof Event2) {
        let next = $;
        let new$1 = new$8.tail;
        let name = $.name;
        let handler = $.handler;
        let added$1 = prepend(next, added);
        let events$1 = add_event(events, mapper, path, name, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = new$1;
        loop$added = added$1;
        loop$removed = removed;
      } else {
        let next = $;
        let new$1 = new$8.tail;
        let added$1 = prepend(next, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = new$1;
        loop$added = added$1;
        loop$removed = removed;
      }
    } else {
      let next = new$8.head;
      let remaining_new = new$8.tail;
      let prev = old.head;
      let remaining_old = old.tail;
      let $ = compare3(prev, next);
      if ($ instanceof Lt) {
        if (prev instanceof Event2) {
          let name = prev.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = remaining_old;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        }
      } else if ($ instanceof Eq) {
        if (next instanceof Attribute) {
          if (prev instanceof Attribute) {
            let _block;
            let $1 = next.name;
            if ($1 === "value") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "checked") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "selected") {
              _block = controlled || prev.value !== next.value;
            } else {
              _block = prev.value !== next.value;
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (prev instanceof Event2) {
            let name = prev.name;
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          } else {
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          }
        } else if (next instanceof Property) {
          if (prev instanceof Property) {
            let _block;
            let $1 = next.name;
            if ($1 === "scrollLeft") {
              _block = true;
            } else if ($1 === "scrollRight") {
              _block = true;
            } else if ($1 === "value") {
              _block = controlled || !isEqual(prev.value, next.value);
            } else if ($1 === "checked") {
              _block = controlled || !isEqual(prev.value, next.value);
            } else if ($1 === "selected") {
              _block = controlled || !isEqual(prev.value, next.value);
            } else {
              _block = !isEqual(prev.value, next.value);
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (prev instanceof Event2) {
            let name = prev.name;
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          } else {
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          }
        } else if (prev instanceof Event2) {
          let name = next.name;
          let handler = next.handler;
          let has_changes = prev.prevent_default !== next.prevent_default || prev.stop_propagation !== next.stop_propagation || prev.immediate !== next.immediate || prev.debounce !== next.debounce || prev.throttle !== next.throttle;
          let _block;
          if (has_changes) {
            _block = prepend(next, added);
          } else {
            _block = added;
          }
          let added$1 = _block;
          let events$1 = add_event(events, mapper, path, name, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let name = next.name;
          let handler = next.handler;
          let added$1 = prepend(next, added);
          let removed$1 = prepend(prev, removed);
          let events$1 = add_event(events, mapper, path, name, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed$1;
        }
      } else if (next instanceof Event2) {
        let name = next.name;
        let handler = next.handler;
        let added$1 = prepend(next, added);
        let events$1 = add_event(events, mapper, path, name, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else {
        let added$1 = prepend(next, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      }
    }
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$path, loop$changes, loop$children, loop$mapper, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$8 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let path = loop$path;
    let changes = loop$changes;
    let children = loop$children;
    let mapper = loop$mapper;
    let events = loop$events;
    if (new$8 instanceof Empty) {
      if (old instanceof Empty) {
        return new Diff(
          new Patch(patch_index, removed, changes, children),
          events
        );
      } else {
        let prev = old.head;
        let old$1 = old.tail;
        let _block;
        let $ = prev.key === "" || !contains(moved, prev.key);
        if ($) {
          _block = removed + advance(prev);
        } else {
          _block = removed;
        }
        let removed$1 = _block;
        let events$1 = remove_child(events, path, node_index, prev);
        loop$old = old$1;
        loop$old_keyed = old_keyed;
        loop$new = new$8;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset;
        loop$removed = removed$1;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = changes;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      }
    } else if (old instanceof Empty) {
      let events$1 = add_children(
        events,
        mapper,
        path,
        node_index,
        new$8
      );
      let insert5 = insert4(new$8, node_index - moved_offset);
      let changes$1 = prepend(insert5, changes);
      return new Diff(
        new Patch(patch_index, removed, changes$1, children),
        events$1
      );
    } else {
      let next = new$8.head;
      let prev = old.head;
      if (prev.key !== next.key) {
        let new_remaining = new$8.tail;
        let old_remaining = old.tail;
        let next_did_exist = get(old_keyed, next.key);
        let prev_does_exist = get(new_keyed, prev.key);
        let prev_has_moved = contains(moved, prev.key);
        if (next_did_exist instanceof Ok) {
          if (prev_does_exist instanceof Ok) {
            if (prev_has_moved) {
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new$8;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - advance(prev);
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            } else {
              let match = next_did_exist[0];
              let count2 = advance(next);
              let before = node_index - moved_offset;
              let move2 = move(next.key, before, count2);
              let changes$1 = prepend(move2, changes);
              let moved$1 = insert2(moved, next.key);
              let moved_offset$1 = moved_offset + count2;
              loop$old = prepend(match, old);
              loop$old_keyed = old_keyed;
              loop$new = new$8;
              loop$new_keyed = new_keyed;
              loop$moved = moved$1;
              loop$moved_offset = moved_offset$1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes$1;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            }
          } else {
            let count2 = advance(prev);
            let moved_offset$1 = moved_offset - count2;
            let events$1 = remove_child(events, path, node_index, prev);
            let remove3 = remove_key(prev.key, count2);
            let changes$1 = prepend(remove3, changes);
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new$8;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset$1;
            loop$removed = removed;
            loop$node_index = node_index;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes$1;
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if (prev_does_exist instanceof Ok) {
          let before = node_index - moved_offset;
          let count2 = advance(next);
          let events$1 = add_child(
            events,
            mapper,
            path,
            node_index,
            next
          );
          let insert5 = insert4(toList([next]), before);
          let changes$1 = prepend(insert5, changes);
          loop$old = old;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset + count2;
          loop$removed = removed;
          loop$node_index = node_index + count2;
          loop$patch_index = patch_index;
          loop$path = path;
          loop$changes = changes$1;
          loop$children = children;
          loop$mapper = mapper;
          loop$events = events$1;
        } else {
          let prev_count = advance(prev);
          let next_count = advance(next);
          let change = replace2(
            node_index - moved_offset,
            prev_count,
            next
          );
          let _block;
          let _pipe = events;
          let _pipe$1 = remove_child(_pipe, path, node_index, prev);
          _block = add_child(_pipe$1, mapper, path, node_index, next);
          let events$1 = _block;
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset - prev_count + next_count;
          loop$removed = removed;
          loop$node_index = node_index + next_count;
          loop$patch_index = patch_index;
          loop$path = path;
          loop$changes = prepend(change, changes);
          loop$children = children;
          loop$mapper = mapper;
          loop$events = events$1;
        }
      } else {
        let $ = old.head;
        if ($ instanceof Fragment) {
          let $1 = new$8.head;
          if ($1 instanceof Fragment) {
            let next$1 = $1;
            let new$1 = new$8.tail;
            let prev$1 = $;
            let old$1 = old.tail;
            let node_index$1 = node_index + 1;
            let prev_count = prev$1.children_count;
            let next_count = next$1.children_count;
            let composed_mapper = compose_mapper(mapper, next$1.mapper);
            let child = do_diff(
              prev$1.children,
              prev$1.keyed_children,
              next$1.children,
              next$1.keyed_children,
              empty_set(),
              moved_offset,
              0,
              node_index$1,
              -1,
              path,
              empty_list,
              children,
              composed_mapper,
              events
            );
            let _block;
            let $2 = child.patch.removed > 0;
            if ($2) {
              let remove_from = node_index$1 + next_count - moved_offset;
              let patch = remove2(remove_from, child.patch.removed);
              _block = append(
                child.patch.changes,
                prepend(patch, changes)
              );
            } else {
              _block = append(child.patch.changes, changes);
            }
            let changes$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset + next_count - prev_count;
            loop$removed = removed;
            loop$node_index = node_index$1 + next_count;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes$1;
            loop$children = child.patch.children;
            loop$mapper = mapper;
            loop$events = child.events;
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let prev_count = advance(prev$1);
            let next_count = advance(next$1);
            let change = replace2(
              node_index - moved_offset,
              prev_count,
              next$1
            );
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset - prev_count + next_count;
            loop$removed = removed;
            loop$node_index = node_index + next_count;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if ($ instanceof Element) {
          let $1 = new$8.head;
          if ($1 instanceof Element) {
            let next$1 = $1;
            let prev$1 = $;
            if (prev$1.namespace === next$1.namespace && prev$1.tag === next$1.tag) {
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              let composed_mapper = compose_mapper(
                mapper,
                next$1.mapper
              );
              let child_path = add3(path, node_index, next$1.key);
              let controlled = is_controlled(
                events,
                next$1.namespace,
                next$1.tag,
                child_path
              );
              let $2 = diff_attributes(
                controlled,
                child_path,
                composed_mapper,
                events,
                prev$1.attributes,
                next$1.attributes,
                empty_list,
                empty_list
              );
              let added_attrs = $2.added;
              let removed_attrs = $2.removed;
              let events$1 = $2.events;
              let _block;
              if (removed_attrs instanceof Empty) {
                if (added_attrs instanceof Empty) {
                  _block = empty_list;
                } else {
                  _block = toList([update(added_attrs, removed_attrs)]);
                }
              } else {
                _block = toList([update(added_attrs, removed_attrs)]);
              }
              let initial_child_changes = _block;
              let child = do_diff(
                prev$1.children,
                prev$1.keyed_children,
                next$1.children,
                next$1.keyed_children,
                empty_set(),
                0,
                0,
                0,
                node_index,
                child_path,
                initial_child_changes,
                empty_list,
                composed_mapper,
                events$1
              );
              let _block$1;
              let $3 = child.patch;
              let $4 = $3.children;
              if ($4 instanceof Empty) {
                let $5 = $3.changes;
                if ($5 instanceof Empty) {
                  let $6 = $3.removed;
                  if ($6 === 0) {
                    _block$1 = children;
                  } else {
                    _block$1 = prepend(child.patch, children);
                  }
                } else {
                  _block$1 = prepend(child.patch, children);
                }
              } else {
                _block$1 = prepend(child.patch, children);
              }
              let children$1 = _block$1;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children$1;
              loop$mapper = mapper;
              loop$events = child.events;
            } else {
              let next$2 = $1;
              let new_remaining = new$8.tail;
              let prev$2 = $;
              let old_remaining = old.tail;
              let prev_count = advance(prev$2);
              let next_count = advance(next$2);
              let change = replace2(
                node_index - moved_offset,
                prev_count,
                next$2
              );
              let _block;
              let _pipe = events;
              let _pipe$1 = remove_child(
                _pipe,
                path,
                node_index,
                prev$2
              );
              _block = add_child(
                _pipe$1,
                mapper,
                path,
                node_index,
                next$2
              );
              let events$1 = _block;
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - prev_count + next_count;
              loop$removed = removed;
              loop$node_index = node_index + next_count;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let prev_count = advance(prev$1);
            let next_count = advance(next$1);
            let change = replace2(
              node_index - moved_offset,
              prev_count,
              next$1
            );
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset - prev_count + next_count;
            loop$removed = removed;
            loop$node_index = node_index + next_count;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if ($ instanceof Text) {
          let $1 = new$8.head;
          if ($1 instanceof Text) {
            let next$1 = $1;
            let prev$1 = $;
            if (prev$1.content === next$1.content) {
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            } else {
              let next$2 = $1;
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              let child = new$4(
                node_index,
                0,
                toList([replace_text(next$2.content)]),
                empty_list
              );
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = prepend(child, children);
              loop$mapper = mapper;
              loop$events = events;
            }
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let prev_count = advance(prev$1);
            let next_count = advance(next$1);
            let change = replace2(
              node_index - moved_offset,
              prev_count,
              next$1
            );
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset - prev_count + next_count;
            loop$removed = removed;
            loop$node_index = node_index + next_count;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else {
          let $1 = new$8.head;
          if ($1 instanceof UnsafeInnerHtml) {
            let next$1 = $1;
            let new$1 = new$8.tail;
            let prev$1 = $;
            let old$1 = old.tail;
            let composed_mapper = compose_mapper(mapper, next$1.mapper);
            let child_path = add3(path, node_index, next$1.key);
            let $2 = diff_attributes(
              false,
              child_path,
              composed_mapper,
              events,
              prev$1.attributes,
              next$1.attributes,
              empty_list,
              empty_list
            );
            let added_attrs = $2.added;
            let removed_attrs = $2.removed;
            let events$1 = $2.events;
            let _block;
            if (removed_attrs instanceof Empty) {
              if (added_attrs instanceof Empty) {
                _block = empty_list;
              } else {
                _block = toList([update(added_attrs, removed_attrs)]);
              }
            } else {
              _block = toList([update(added_attrs, removed_attrs)]);
            }
            let child_changes = _block;
            let _block$1;
            let $3 = prev$1.inner_html === next$1.inner_html;
            if ($3) {
              _block$1 = child_changes;
            } else {
              _block$1 = prepend(
                replace_inner_html(next$1.inner_html),
                child_changes
              );
            }
            let child_changes$1 = _block$1;
            let _block$2;
            if (child_changes$1 instanceof Empty) {
              _block$2 = children;
            } else {
              _block$2 = prepend(
                new$4(node_index, 0, child_changes$1, toList([])),
                children
              );
            }
            let children$1 = _block$2;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes;
            loop$children = children$1;
            loop$mapper = mapper;
            loop$events = events$1;
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let prev_count = advance(prev$1);
            let next_count = advance(next$1);
            let change = replace2(
              node_index - moved_offset,
              prev_count,
              next$1
            );
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset - prev_count + next_count;
            loop$removed = removed;
            loop$node_index = node_index + next_count;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        }
      }
    }
  }
}
function diff(events, old, new$8) {
  return do_diff(
    toList([old]),
    empty2(),
    toList([new$8]),
    empty2(),
    empty_set(),
    0,
    0,
    0,
    0,
    root2,
    empty_list,
    empty_list,
    identity2,
    tick(events)
  );
}

// build/dev/javascript/lustre/lustre/vdom/reconciler.ffi.mjs
var Reconciler = class {
  offset = 0;
  #root = null;
  #dispatch = () => {
  };
  #useServerEvents = false;
  constructor(root3, dispatch, { useServerEvents = false } = {}) {
    this.#root = root3;
    this.#dispatch = dispatch;
    this.#useServerEvents = useServerEvents;
  }
  mount(vdom) {
    appendChild(this.#root, this.#createChild(this.#root, vdom));
  }
  #stack = [];
  push(patch) {
    const offset = this.offset;
    if (offset) {
      iterate(patch.changes, (change) => {
        switch (change.kind) {
          case insert_kind:
          case move_kind:
            change.before = (change.before | 0) + offset;
            break;
          case remove_kind:
          case replace_kind:
            change.from = (change.from | 0) + offset;
            break;
        }
      });
      iterate(patch.children, (child) => {
        child.index = (child.index | 0) + offset;
      });
    }
    this.#stack.push({ node: this.#root, patch });
    this.#reconcile();
  }
  // PATCHING ------------------------------------------------------------------
  #reconcile() {
    const self = this;
    while (self.#stack.length) {
      const { node, patch } = self.#stack.pop();
      iterate(patch.changes, (change) => {
        switch (change.kind) {
          case insert_kind:
            self.#insert(node, change.children, change.before);
            break;
          case move_kind:
            self.#move(node, change.key, change.before, change.count);
            break;
          case remove_key_kind:
            self.#removeKey(node, change.key, change.count);
            break;
          case remove_kind:
            self.#remove(node, change.from, change.count);
            break;
          case replace_kind:
            self.#replace(node, change.from, change.count, change.with);
            break;
          case replace_text_kind:
            self.#replaceText(node, change.content);
            break;
          case replace_inner_html_kind:
            self.#replaceInnerHtml(node, change.inner_html);
            break;
          case update_kind:
            self.#update(node, change.added, change.removed);
            break;
        }
      });
      if (patch.removed) {
        self.#remove(
          node,
          node.childNodes.length - patch.removed,
          patch.removed
        );
      }
      let lastIndex = -1;
      let lastChild = null;
      iterate(patch.children, (child) => {
        const index3 = child.index | 0;
        const next = lastChild && lastIndex - index3 === 1 ? lastChild.previousSibling : childAt(node, index3);
        self.#stack.push({ node: next, patch: child });
        lastChild = next;
        lastIndex = index3;
      });
    }
  }
  // CHANGES -------------------------------------------------------------------
  #insert(node, children, before) {
    const fragment3 = createDocumentFragment();
    iterate(children, (child) => {
      const el = this.#createChild(node, child);
      appendChild(fragment3, el);
    });
    insertBefore(node, fragment3, childAt(node, before));
  }
  #move(node, key, before, count2) {
    let el = getKeyedChild(node, key);
    const beforeEl = childAt(node, before);
    for (let i = 0; i < count2 && el !== null; ++i) {
      const next = el.nextSibling;
      if (SUPPORTS_MOVE_BEFORE) {
        node.moveBefore(el, beforeEl);
      } else {
        insertBefore(node, el, beforeEl);
      }
      el = next;
    }
  }
  #removeKey(node, key, count2) {
    this.#removeFromChild(node, getKeyedChild(node, key), count2);
  }
  #remove(node, from, count2) {
    this.#removeFromChild(node, childAt(node, from), count2);
  }
  #removeFromChild(parent, child, count2) {
    while (count2-- > 0 && child !== null) {
      const next = child.nextSibling;
      const key = child[meta].key;
      if (key) {
        parent[meta].keyedChildren.delete(key);
      }
      for (const [_, { timeout }] of child[meta].debouncers ?? []) {
        clearTimeout(timeout);
      }
      parent.removeChild(child);
      child = next;
    }
  }
  #replace(parent, from, count2, child) {
    this.#remove(parent, from, count2);
    const el = this.#createChild(parent, child);
    insertBefore(parent, el, childAt(parent, from));
  }
  #replaceText(node, content) {
    node.data = content ?? "";
  }
  #replaceInnerHtml(node, inner_html) {
    node.innerHTML = inner_html ?? "";
  }
  #update(node, added, removed) {
    iterate(removed, (attribute3) => {
      const name = attribute3.name;
      if (node[meta].handlers.has(name)) {
        node.removeEventListener(name, handleEvent);
        node[meta].handlers.delete(name);
        if (node[meta].throttles.has(name)) {
          node[meta].throttles.delete(name);
        }
        if (node[meta].debouncers.has(name)) {
          clearTimeout(node[meta].debouncers.get(name).timeout);
          node[meta].debouncers.delete(name);
        }
      } else {
        node.removeAttribute(name);
        SYNCED_ATTRIBUTES[name]?.removed?.(node, name);
      }
    });
    iterate(added, (attribute3) => {
      this.#createAttribute(node, attribute3);
    });
  }
  // CONSTRUCTORS --------------------------------------------------------------
  #createChild(parent, vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = createChildElement(parent, vnode);
        this.#createAttributes(node, vnode);
        this.#insert(node, vnode.children, 0);
        return node;
      }
      case text_kind: {
        return createChildText(parent, vnode);
      }
      case fragment_kind: {
        const node = createDocumentFragment();
        const head = createChildText(parent, vnode);
        appendChild(node, head);
        iterate(vnode.children, (child) => {
          appendChild(node, this.#createChild(parent, child));
        });
        return node;
      }
      case unsafe_inner_html_kind: {
        const node = createChildElement(parent, vnode);
        this.#createAttributes(node, vnode);
        this.#replaceInnerHtml(node, vnode.inner_html);
        return node;
      }
    }
  }
  #createAttributes(node, { attributes }) {
    iterate(attributes, (attribute3) => this.#createAttribute(node, attribute3));
  }
  #createAttribute(node, attribute3) {
    const { debouncers, handlers, throttles } = node[meta];
    const {
      kind,
      name,
      value,
      prevent_default: prevent,
      stop_propagation: stop,
      immediate: immediate2,
      include,
      debounce: debounceDelay,
      throttle: throttleDelay
    } = attribute3;
    switch (kind) {
      case attribute_kind: {
        const valueOrDefault = value ?? "";
        if (name === "virtual:defaultValue") {
          node.defaultValue = valueOrDefault;
          return;
        }
        if (valueOrDefault !== node.getAttribute(name)) {
          node.setAttribute(name, valueOrDefault);
        }
        SYNCED_ATTRIBUTES[name]?.added?.(node, value);
        break;
      }
      case property_kind:
        node[name] = value;
        break;
      case event_kind: {
        if (!handlers.has(name)) {
          node.addEventListener(name, handleEvent, {
            passive: !attribute3.prevent_default
          });
        }
        if (throttleDelay > 0) {
          const throttle = throttles.get(name) ?? {};
          throttle.delay = throttleDelay;
          throttles.set(name, throttle);
        } else {
          throttles.delete(name);
        }
        if (debounceDelay > 0) {
          const debounce = debouncers.get(name) ?? {};
          debounce.delay = debounceDelay;
          debouncers.set(name, debounce);
        } else {
          clearTimeout(debouncers.get(name)?.timeout);
          debouncers.delete(name);
        }
        handlers.set(name, (event4) => {
          if (prevent) event4.preventDefault();
          if (stop) event4.stopPropagation();
          const type = event4.type;
          let path = "";
          let pathNode = event4.currentTarget;
          while (pathNode !== this.#root) {
            const key = pathNode[meta].key;
            const parent = pathNode.parentNode;
            if (key) {
              path = `${separator_key}${key}${path}`;
            } else {
              const siblings = parent.childNodes;
              let index3 = [].indexOf.call(siblings, pathNode);
              if (parent === this.#root) {
                index3 -= this.offset;
              }
              path = `${separator_index}${index3}${path}`;
            }
            pathNode = parent;
          }
          path = path.slice(1);
          const data = this.#useServerEvents ? createServerEvent(event4, include ?? []) : event4;
          const throttle = throttles.get(type);
          if (throttle) {
            const now = Date.now();
            const last = throttle.last || 0;
            if (now > last + throttle.delay) {
              throttle.last = now;
              throttle.lastEvent = event4;
              this.#dispatch(data, path, type, immediate2);
            } else {
              event4.preventDefault();
            }
          }
          const debounce = debouncers.get(type);
          if (debounce) {
            clearTimeout(debounce.timeout);
            debounce.timeout = setTimeout(() => {
              if (event4 === throttles.get(type)?.lastEvent) return;
              this.#dispatch(data, path, type, immediate2);
            }, debounce.delay);
          } else {
            this.#dispatch(data, path, type, immediate2);
          }
        });
        break;
      }
    }
  }
};
var iterate = (list4, callback) => {
  if (Array.isArray(list4)) {
    for (let i = 0; i < list4.length; i++) {
      callback(list4[i]);
    }
  } else if (list4) {
    for (list4; list4.tail; list4 = list4.tail) {
      callback(list4.head);
    }
  }
};
var appendChild = (node, child) => node.appendChild(child);
var insertBefore = (parent, node, referenceNode) => parent.insertBefore(node, referenceNode ?? null);
var createChildElement = (parent, { key, tag, namespace }) => {
  const node = document.createElementNS(namespace || NAMESPACE_HTML, tag);
  initialiseMetadata(parent, node, key);
  return node;
};
var createChildText = (parent, { key, content }) => {
  const node = document.createTextNode(content ?? "");
  initialiseMetadata(parent, node, key);
  return node;
};
var createDocumentFragment = () => document.createDocumentFragment();
var childAt = (node, at) => node.childNodes[at | 0];
var meta = Symbol("lustre");
var initialiseMetadata = (parent, node, key = "") => {
  switch (node.nodeType) {
    case ELEMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      node[meta] = {
        key,
        keyedChildren: /* @__PURE__ */ new Map(),
        handlers: /* @__PURE__ */ new Map(),
        throttles: /* @__PURE__ */ new Map(),
        debouncers: /* @__PURE__ */ new Map()
      };
      break;
    case TEXT_NODE:
      node[meta] = { key };
      break;
  }
  if (parent && key) {
    parent[meta].keyedChildren.set(key, new WeakRef(node));
  }
};
var getKeyedChild = (node, key) => node[meta].keyedChildren.get(key).deref();
var handleEvent = (event4) => {
  const target = event4.currentTarget;
  const handler = target[meta].handlers.get(event4.type);
  if (event4.type === "submit") {
    event4.detail ??= {};
    event4.detail.formData = [...new FormData(event4.target).entries()];
  }
  handler(event4);
};
var createServerEvent = (event4, include = []) => {
  const data = {};
  if (event4.type === "input" || event4.type === "change") {
    include.push("target.value");
  }
  if (event4.type === "submit") {
    include.push("detail.formData");
  }
  for (const property3 of include) {
    const path = property3.split(".");
    for (let i = 0, input = event4, output = data; i < path.length; i++) {
      if (i === path.length - 1) {
        output[path[i]] = input[path[i]];
        break;
      }
      output = output[path[i]] ??= {};
      input = input[path[i]];
    }
  }
  return data;
};
var syncedBooleanAttribute = (name) => {
  return {
    added(node) {
      node[name] = true;
    },
    removed(node) {
      node[name] = false;
    }
  };
};
var syncedAttribute = (name) => {
  return {
    added(node, value) {
      node[name] = value;
    }
  };
};
var SYNCED_ATTRIBUTES = {
  checked: syncedBooleanAttribute("checked"),
  selected: syncedBooleanAttribute("selected"),
  value: syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => node.focus?.());
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// build/dev/javascript/lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root3) => {
  const vdom = virtualiseNode(null, root3);
  if (vdom === null || vdom.children instanceof Empty) {
    const empty3 = emptyTextNode(root3);
    root3.appendChild(empty3);
    return none2();
  } else if (vdom.children instanceof NonEmpty && vdom.children.tail instanceof Empty) {
    return vdom.children.head;
  } else {
    const head = emptyTextNode(root3);
    root3.insertBefore(head, root3.firstChild);
    return fragment2(vdom.children);
  }
};
var emptyTextNode = (parent) => {
  const node = document.createTextNode("");
  initialiseMetadata(parent, node);
  return node;
};
var virtualiseNode = (parent, node) => {
  switch (node.nodeType) {
    case ELEMENT_NODE: {
      const key = node.getAttribute("data-lustre-key");
      initialiseMetadata(parent, node, key);
      if (key) {
        node.removeAttribute("data-lustre-key");
      }
      const tag = node.localName;
      const namespace = node.namespaceURI;
      const isHtmlElement = !namespace || namespace === NAMESPACE_HTML;
      if (isHtmlElement && INPUT_ELEMENTS.includes(tag)) {
        virtualiseInputEvents(tag, node);
      }
      const attributes = virtualiseAttributes(node);
      const children = virtualiseChildNodes(node);
      const vnode = isHtmlElement ? element2(tag, attributes, children) : namespaced(namespace, tag, attributes, children);
      return key ? to_keyed(key, vnode) : vnode;
    }
    case TEXT_NODE:
      initialiseMetadata(parent, node);
      return text2(node.data);
    case DOCUMENT_FRAGMENT_NODE:
      initialiseMetadata(parent, node);
      return node.childNodes.length > 0 ? fragment2(virtualiseChildNodes(node)) : null;
    default:
      return null;
  }
};
var INPUT_ELEMENTS = ["input", "select", "textarea"];
var virtualiseInputEvents = (tag, node) => {
  const value = node.value;
  const checked = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked) return;
  if (tag === "input" && node.type === "radio" && !checked) return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value) return;
  queueMicrotask(() => {
    node.value = value;
    node.checked = checked;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (document.activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var virtualiseChildNodes = (node) => {
  let children = empty_list;
  let child = node.lastChild;
  while (child) {
    const vnode = virtualiseNode(node, child);
    const next = child.previousSibling;
    if (vnode) {
      children = new NonEmpty(vnode, children);
    } else {
      node.removeChild(child);
    }
    child = next;
  }
  return children;
};
var virtualiseAttributes = (node) => {
  let index3 = node.attributes.length;
  let attributes = empty_list;
  while (index3-- > 0) {
    attributes = new NonEmpty(
      virtualiseAttribute(node.attributes[index3]),
      attributes
    );
  }
  return attributes;
};
var virtualiseAttribute = (attr) => {
  const name = attr.localName;
  const value = attr.value;
  return attribute2(name, value);
};

// build/dev/javascript/lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!document;
var is_reference_equal = (a, b) => a === b;
var Runtime = class {
  constructor(root3, [model, effects], view2, update3) {
    this.root = root3;
    this.#model = model;
    this.#view = view2;
    this.#update = update3;
    this.#reconciler = new Reconciler(this.root, (event4, path, name) => {
      const [events, msg] = handle(this.#events, path, name, event4);
      this.#events = events;
      if (msg.isOk()) {
        this.dispatch(msg[0], false);
      }
    });
    this.#vdom = virtualise(this.root);
    this.#events = new$5();
    this.#shouldFlush = true;
    this.#tick(effects);
  }
  // PUBLIC API ----------------------------------------------------------------
  root = null;
  set offset(offset) {
    this.#reconciler.offset = offset;
  }
  dispatch(msg, immediate2 = false) {
    this.#shouldFlush ||= immediate2;
    if (this.#shouldQueue) {
      this.#queue.push(msg);
    } else {
      const [model, effects] = this.#update(this.#model, msg);
      this.#model = model;
      this.#tick(effects);
    }
  }
  emit(event4, data) {
    const target = this.root.host ?? this.root;
    target.dispatchEvent(
      new CustomEvent(event4, {
        detail: data,
        bubbles: true,
        composed: true
      })
    );
  }
  // PRIVATE API ---------------------------------------------------------------
  #model;
  #view;
  #update;
  #vdom;
  #events;
  #reconciler;
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #shouldFlush = false;
  #actions = {
    dispatch: (msg, immediate2) => this.dispatch(msg, immediate2),
    emit: (event4, data) => this.emit(event4, data),
    select: () => {
    },
    root: () => this.root
  };
  // A `#tick` is where we process effects and trigger any synchronous updates.
  // Once a tick has been processed a render will be scheduled if none is already.
  // p0
  #tick(effects) {
    this.#shouldQueue = true;
    while (true) {
      for (let list4 = effects.synchronous; list4.tail; list4 = list4.tail) {
        list4.head(this.#actions);
      }
      this.#beforePaint = listAppend(this.#beforePaint, effects.before_paint);
      this.#afterPaint = listAppend(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length) break;
      [this.#model, effects] = this.#update(this.#model, this.#queue.shift());
    }
    this.#shouldQueue = false;
    if (this.#shouldFlush) {
      cancelAnimationFrame(this.#renderTimer);
      this.#render();
    } else if (!this.#renderTimer) {
      this.#renderTimer = requestAnimationFrame(() => {
        this.#render();
      });
    }
  }
  #render() {
    this.#shouldFlush = false;
    this.#renderTimer = null;
    const next = this.#view(this.#model);
    const { patch, events } = diff(this.#events, this.#vdom, next);
    this.#events = events;
    this.#vdom = next;
    this.#reconciler.push(patch);
    if (this.#beforePaint instanceof NonEmpty) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
    if (this.#afterPaint instanceof NonEmpty) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      requestAnimationFrame(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
  }
};
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
function listAppend(a, b) {
  if (a instanceof Empty) {
    return b;
  } else if (b instanceof Empty) {
    return a;
  } else {
    return append(a, b);
  }
}

// build/dev/javascript/lustre/lustre/vdom/events.mjs
var Events = class extends CustomType {
  constructor(handlers, dispatched_paths, next_dispatched_paths) {
    super();
    this.handlers = handlers;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
};
function new$5() {
  return new Events(
    empty2(),
    empty_list,
    empty_list
  );
}
function tick(events) {
  return new Events(
    events.handlers,
    events.next_dispatched_paths,
    empty_list
  );
}
function do_remove_event(handlers, path, name) {
  return remove(handlers, event2(path, name));
}
function remove_event(events, path, name) {
  let handlers = do_remove_event(events.handlers, path, name);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function remove_attributes(handlers, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name = attribute3.name;
        return do_remove_event(events, path, name);
      } else {
        return events;
      }
    }
  );
}
function handle(events, path, name, event4) {
  let next_dispatched_paths = prepend(path, events.next_dispatched_paths);
  let _block;
  let _record = events;
  _block = new Events(
    _record.handlers,
    _record.dispatched_paths,
    next_dispatched_paths
  );
  let events$1 = _block;
  let $ = get(
    events$1.handlers,
    path + separator_event + name
  );
  if ($ instanceof Ok) {
    let handler = $[0];
    return [events$1, run(event4, handler)];
  } else {
    return [events$1, new Error(toList([]))];
  }
}
function has_dispatched_events(events, path) {
  return matches(path, events.dispatched_paths);
}
function do_add_event(handlers, mapper, path, name, handler) {
  return insert3(
    handlers,
    event2(path, name),
    map2(handler, identity2(mapper))
  );
}
function add_event(events, mapper, path, name, handler) {
  let handlers = do_add_event(events.handlers, mapper, path, name, handler);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_attributes(handlers, mapper, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name = attribute3.name;
        let handler = attribute3.handler;
        return do_add_event(events, mapper, path, name, handler);
      } else {
        return events;
      }
    }
  );
}
function compose_mapper(mapper, child_mapper) {
  let $ = is_reference_equal(mapper, identity2);
  let $1 = is_reference_equal(child_mapper, identity2);
  if ($1) {
    return mapper;
  } else if ($) {
    return child_mapper;
  } else {
    return (msg) => {
      return mapper(child_mapper(msg));
    };
  }
}
function do_remove_children(loop$handlers, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children instanceof Empty) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_remove_child(_pipe, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$path = path;
      loop$child_index = child_index + advance(child);
      loop$children = rest;
    }
  }
}
function do_remove_child(handlers, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children = child.children;
    return do_remove_children(handlers, parent, child_index + 1, children);
  } else if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add3(parent, child_index, child.key);
    let _pipe = handlers;
    let _pipe$1 = remove_attributes(_pipe, path, attributes);
    return do_remove_children(_pipe$1, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add3(parent, child_index, child.key);
    return remove_attributes(handlers, path, attributes);
  }
}
function remove_child(events, parent, child_index, child) {
  let handlers = do_remove_child(events.handlers, parent, child_index, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function do_add_children(loop$handlers, loop$mapper, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let mapper = loop$mapper;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children instanceof Empty) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_add_child(_pipe, mapper, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$mapper = mapper;
      loop$path = path;
      loop$child_index = child_index + advance(child);
      loop$children = rest;
    }
  }
}
function do_add_child(handlers, mapper, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children = child.children;
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let child_index$1 = child_index + 1;
    return do_add_children(
      handlers,
      composed_mapper,
      parent,
      child_index$1,
      children
    );
  } else if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add3(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let _pipe = handlers;
    let _pipe$1 = add_attributes(_pipe, composed_mapper, path, attributes);
    return do_add_children(_pipe$1, composed_mapper, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add3(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return add_attributes(handlers, composed_mapper, path, attributes);
  }
}
function add_child(events, mapper, parent, index3, child) {
  let handlers = do_add_child(events.handlers, mapper, parent, index3, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_children(events, mapper, path, child_index, children) {
  let handlers = do_add_children(
    events.handlers,
    mapper,
    path,
    child_index,
    children
  );
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}

// build/dev/javascript/lustre/lustre/element.mjs
function element2(tag, attributes, children) {
  return element(
    "",
    identity2,
    "",
    tag,
    attributes,
    children,
    empty2(),
    false,
    false
  );
}
function namespaced(namespace, tag, attributes, children) {
  return element(
    "",
    identity2,
    namespace,
    tag,
    attributes,
    children,
    empty2(),
    false,
    false
  );
}
function text2(content) {
  return text("", identity2, content);
}
function none2() {
  return text("", identity2, "");
}
function count_fragment_children(loop$children, loop$count) {
  while (true) {
    let children = loop$children;
    let count2 = loop$count;
    if (children instanceof Empty) {
      return count2;
    } else {
      let $ = children.head;
      if ($ instanceof Fragment) {
        let rest = children.tail;
        let children_count = $.children_count;
        loop$children = rest;
        loop$count = count2 + children_count;
      } else {
        let rest = children.tail;
        loop$children = rest;
        loop$count = count2 + 1;
      }
    }
  }
}
function fragment2(children) {
  return fragment(
    "",
    identity2,
    children,
    empty2(),
    count_fragment_children(children, 0)
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text3(content) {
  return text2(content);
}
function h1(attrs, children) {
  return element2("h1", attrs, children);
}
function h2(attrs, children) {
  return element2("h2", attrs, children);
}
function h3(attrs, children) {
  return element2("h3", attrs, children);
}
function h4(attrs, children) {
  return element2("h4", attrs, children);
}
function div(attrs, children) {
  return element2("div", attrs, children);
}
function p(attrs, children) {
  return element2("p", attrs, children);
}
function span(attrs, children) {
  return element2("span", attrs, children);
}
function button(attrs, children) {
  return element2("button", attrs, children);
}
function label(attrs, children) {
  return element2("label", attrs, children);
}

// build/dev/javascript/lustre/lustre/runtime/server/runtime.mjs
var EffectDispatchedMessage = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var EffectEmitEvent = class extends CustomType {
  constructor(name, data) {
    super();
    this.name = name;
    this.data = data;
  }
};
var SystemRequestedShutdown = class extends CustomType {
};

// build/dev/javascript/lustre/lustre/component.mjs
var Config2 = class extends CustomType {
  constructor(open_shadow_root, adopt_styles, attributes, properties, is_form_associated, on_form_autofill, on_form_reset, on_form_restore) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.attributes = attributes;
    this.properties = properties;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
  }
};
function new$6(options) {
  let init2 = new Config2(
    false,
    true,
    empty_dict(),
    empty_dict(),
    false,
    option_none,
    option_none,
    option_none
  );
  return fold(
    options,
    init2,
    (config, option) => {
      return option.apply(config);
    }
  );
}

// build/dev/javascript/lustre/lustre/runtime/client/spa.ffi.mjs
var Spa = class _Spa {
  static start({ init: init2, update: update3, view: view2 }, selector, flags) {
    if (!is_browser()) return new Error(new NotABrowser());
    const root3 = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root3) return new Error(new ElementNotFound(selector));
    return new Ok(new _Spa(root3, init2(flags), update3, view2));
  }
  #runtime;
  constructor(root3, [init2, effects], update3, view2) {
    this.#runtime = new Runtime(root3, [init2, effects], view2, update3);
  }
  send(message) {
    switch (message.constructor) {
      case EffectDispatchedMessage: {
        this.dispatch(message.message, false);
        break;
      }
      case EffectEmitEvent: {
        this.emit(message.name, message.data);
        break;
      }
      case SystemRequestedShutdown:
        break;
    }
  }
  dispatch(msg, immediate2) {
    this.#runtime.dispatch(msg, immediate2);
  }
  emit(event4, data) {
    this.#runtime.emit(event4, data);
  }
};
var start = Spa.start;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init2, update3, view2, config) {
    super();
    this.init = init2;
    this.update = update3;
    this.view = view2;
    this.config = config;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init2, update3, view2) {
  return new App(init2, update3, view2, new$6(empty_list));
}
function simple(init2, update3, view2) {
  let init$1 = (start_args) => {
    return [init2(start_args), none()];
  };
  let update$1 = (model, msg) => {
    return [update3(model, msg), none()];
  };
  return application(init$1, update$1, view2);
}
function start3(app, selector, start_args) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, start_args);
    }
  );
}

// build/dev/javascript/newmoon/types.mjs
var Bomb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Point = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Health = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Collector = class extends CustomType {
};
var Survivor = class extends CustomType {
};
var Multiplier = class extends CustomType {
};
var Choice = class extends CustomType {
};
var Gamble = class extends CustomType {
};
var PointScanner = class extends CustomType {
};
var PointRecovery = class extends CustomType {
};
var MainMenu = class extends CustomType {
};
var Playing = class extends CustomType {
};
var Paused = class extends CustomType {
};
var LevelComplete = class extends CustomType {
};
var GameOver = class extends CustomType {
};
var InMarketplace = class extends CustomType {
};
var InTestingGrounds = class extends CustomType {
};
var ChoosingOrb = class extends CustomType {
};
var GamblingChoice = class extends CustomType {
};
var ViewingGambleResults = class extends CustomType {
};
var ApplyingGambleOrbs = class extends CustomType {
};
var Model = class extends CustomType {
  constructor(health, points, level, milestone, bag, status, last_orb, bombs_pulled_this_level, current_multiplier, credits, shuffle_enabled, dev_mode, testing_config, testing_mode, testing_stats, log_entries, log_sequence, pending_choice, pending_gamble, gamble_orbs, gamble_current_index, in_gamble_choice, point_orbs_pulled_this_level) {
    super();
    this.health = health;
    this.points = points;
    this.level = level;
    this.milestone = milestone;
    this.bag = bag;
    this.status = status;
    this.last_orb = last_orb;
    this.bombs_pulled_this_level = bombs_pulled_this_level;
    this.current_multiplier = current_multiplier;
    this.credits = credits;
    this.shuffle_enabled = shuffle_enabled;
    this.dev_mode = dev_mode;
    this.testing_config = testing_config;
    this.testing_mode = testing_mode;
    this.testing_stats = testing_stats;
    this.log_entries = log_entries;
    this.log_sequence = log_sequence;
    this.pending_choice = pending_choice;
    this.pending_gamble = pending_gamble;
    this.gamble_orbs = gamble_orbs;
    this.gamble_current_index = gamble_current_index;
    this.in_gamble_choice = in_gamble_choice;
    this.point_orbs_pulled_this_level = point_orbs_pulled_this_level;
  }
};
var StartNewGame = class extends CustomType {
};
var ContinueGame = class extends CustomType {
};
var ShowHowToPlay = class extends CustomType {
};
var PullOrb = class extends CustomType {
};
var PauseGame = class extends CustomType {
};
var ResumeGame = class extends CustomType {
};
var NextLevel = class extends CustomType {
};
var RestartLevel = class extends CustomType {
};
var GoToMainMenu = class extends CustomType {
};
var GoToMarketplace = class extends CustomType {
};
var GoToTestingGrounds = class extends CustomType {
};
var AcceptLevelReward = class extends CustomType {
};
var BuyOrb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ToggleShuffle = class extends CustomType {
};
var ToggleDevMode = class extends CustomType {
};
var SelectFirstChoice = class extends CustomType {
};
var SelectSecondChoice = class extends CustomType {
};
var AcceptGamble = class extends CustomType {
};
var DeclineGamble = class extends CustomType {
};
var NextGambleOrb = class extends CustomType {
};
var ExitTestingGrounds = class extends CustomType {
};
var AddTestOrb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var RemoveTestOrb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var SetTestMilestone = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var SetTestHealth = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var SetSimulationCount = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var StartSimulations = class extends CustomType {
};
var ViewTestResults = class extends CustomType {
};
var ResetTestConfig = class extends CustomType {
};
var MarketItem = class extends CustomType {
  constructor(orb, price, description) {
    super();
    this.orb = orb;
    this.price = price;
    this.description = description;
  }
};
var TestingConfiguration = class extends CustomType {
  constructor(test_bag, target_milestone, starting_health, simulation_count) {
    super();
    this.test_bag = test_bag;
    this.target_milestone = target_milestone;
    this.starting_health = starting_health;
    this.simulation_count = simulation_count;
  }
};
var SimulationResult = class extends CustomType {
  constructor(won, final_points, final_health, orbs_pulled, bombs_hit) {
    super();
    this.won = won;
    this.final_points = final_points;
    this.final_health = final_health;
    this.orbs_pulled = orbs_pulled;
    this.bombs_hit = bombs_hit;
  }
};
var TestingStats = class extends CustomType {
  constructor(total_runs, wins, losses, win_rate, average_points, best_score, worst_score, results) {
    super();
    this.total_runs = total_runs;
    this.wins = wins;
    this.losses = losses;
    this.win_rate = win_rate;
    this.average_points = average_points;
    this.best_score = best_score;
    this.worst_score = worst_score;
    this.results = results;
  }
};
var ConfiguringTest = class extends CustomType {
};
var RunningSimulations = class extends CustomType {
};
var ViewingResults = class extends CustomType {
};
var LogEntry = class extends CustomType {
  constructor(sequence, orb, message) {
    super();
    this.sequence = sequence;
    this.orb = orb;
    this.message = message;
  }
};

// build/dev/javascript/newmoon/level.mjs
function create_level_bag(loop$level) {
  while (true) {
    let level = loop$level;
    if (level === 1) {
      return toList([
        new Gamble(),
        new Choice(),
        new Point(8),
        new Point(10),
        new Point(12),
        new Point(6),
        new Point(8),
        new Point(10),
        new Bomb(2),
        new Bomb(2),
        new Bomb(3),
        new Health(2),
        new Health(3),
        new Collector()
      ]);
    } else if (level === 2) {
      return toList([
        new Point(12),
        new Point(10),
        new Point(8),
        new Point(10),
        new Point(15),
        new Bomb(2),
        new Bomb(2),
        new Bomb(3),
        new Bomb(3),
        new Health(2),
        new Health(3),
        new Collector(),
        new Multiplier(),
        new Survivor()
      ]);
    } else if (level === 3) {
      return toList([
        new Point(7),
        new Point(8),
        new Point(9),
        new Point(9),
        new Point(9),
        new Bomb(2),
        new Bomb(2),
        new Bomb(3),
        new Bomb(3),
        new Health(1),
        new Health(3),
        new Collector(),
        new Multiplier(),
        new Choice()
      ]);
    } else if (level === 4) {
      return toList([
        new Point(8),
        new Point(9),
        new Point(9),
        new Point(9),
        new Point(9),
        new Bomb(2),
        new Bomb(3),
        new Bomb(3),
        new Bomb(3),
        new Bomb(3),
        new Health(1),
        new Health(3),
        new Health(3),
        new Multiplier(),
        new Survivor(),
        new Choice()
      ]);
    } else if (level === 5) {
      return toList([
        new Point(9),
        new Point(9),
        new Point(9),
        new Point(9),
        new Point(9),
        new Point(9),
        new Bomb(3),
        new Bomb(3),
        new Bomb(3),
        new Bomb(3),
        new Bomb(3),
        new Bomb(3),
        new Health(3),
        new Health(3),
        new Health(3),
        new Collector(),
        new Survivor(),
        new Gamble()
      ]);
    } else {
      loop$level = 5;
    }
  }
}
function get_milestone_for_level(level) {
  if (level === 1) {
    return 50;
  } else if (level === 2) {
    return 80;
  } else if (level === 3) {
    return 120;
  } else if (level === 4) {
    return 180;
  } else if (level === 5) {
    return 250;
  } else {
    return 250 + (level - 5) * 50;
  }
}

// build/dev/javascript/lustre/lustre/event.mjs
function is_immediate_event(name) {
  if (name === "input") {
    return true;
  } else if (name === "change") {
    return true;
  } else if (name === "focus") {
    return true;
  } else if (name === "focusin") {
    return true;
  } else if (name === "focusout") {
    return true;
  } else if (name === "blur") {
    return true;
  } else if (name === "select") {
    return true;
  } else {
    return false;
  }
}
function on(name, handler) {
  return event(
    name,
    handler,
    empty_list,
    false,
    false,
    is_immediate_event(name),
    0,
    0
  );
}
function on_click(msg) {
  return on("click", success(msg));
}

// build/dev/javascript/newmoon/orb.mjs
function get_orb_result_message(orb, model) {
  if (orb instanceof Bomb) {
    let damage = orb[0];
    return "\u25CB HULL BREACH [SEVERITY-" + to_string(damage) + "] -" + to_string(
      damage
    ) + " SYS";
  } else if (orb instanceof Point) {
    let value = orb[0];
    let multiplied_value = value * model.current_multiplier;
    let $ = model.current_multiplier > 1;
    if ($) {
      return "\u25CF DATA PACKET [" + to_string(value) + "\xD7" + to_string(
        model.current_multiplier
      ) + "] +" + to_string(multiplied_value);
    } else {
      return "\u25CF DATA PACKET ACQUIRED +" + to_string(value);
    }
  } else if (orb instanceof Health) {
    let value = orb[0];
    return "+ NANO-REPAIR DEPLOYED [EFFICIENCY-" + to_string(value) + "] +" + to_string(
      value
    ) + " SYS";
  } else if (orb instanceof Collector) {
    let _block;
    let _pipe = model.bag;
    _block = length(_pipe);
    let base_points = _block;
    let multiplied_points = base_points * model.current_multiplier;
    let $ = model.current_multiplier > 1;
    if ($) {
      return "\u25EF DEEP SCAN [" + to_string(base_points) + "\xD7" + to_string(
        model.current_multiplier
      ) + "] +" + to_string(multiplied_points);
    } else {
      return "\u25EF DEEP SCAN COMPLETE +" + to_string(base_points);
    }
  } else if (orb instanceof Survivor) {
    let base_points = model.bombs_pulled_this_level;
    let multiplied_points = base_points * model.current_multiplier;
    let $ = model.current_multiplier > 1;
    if ($) {
      return "\u25C8 DAMAGE ANALYSIS [" + to_string(base_points) + "\xD7" + to_string(
        model.current_multiplier
      ) + "] +" + to_string(multiplied_points);
    } else {
      return "\u25C8 DAMAGE ANALYSIS +" + to_string(base_points);
    }
  } else if (orb instanceof Multiplier) {
    return "\u2731 SIGNAL BOOST [" + to_string(model.current_multiplier) + "\xD7 AMPLIFICATION ACTIVE]";
  } else if (orb instanceof Choice) {
    return "\u25C6 CHOICE PROTOCOL ACTIVATED [SELECT OPTIMAL SAMPLE]";
  } else if (orb instanceof Gamble) {
    return "\u{1F3B2} GAMBLE PROTOCOL ACTIVATED [HIGH RISK/REWARD SCENARIO]";
  } else if (orb instanceof PointScanner) {
    let _block;
    let _pipe = model.bag;
    _block = count(
      _pipe,
      (orb2) => {
        if (orb2 instanceof Point) {
          return true;
        } else {
          return false;
        }
      }
    );
    let point_orbs_count = _block;
    let multiplied_points = point_orbs_count * model.current_multiplier;
    let $ = model.current_multiplier > 1;
    if ($) {
      return "\u25C9 DATA SCANNER [" + to_string(point_orbs_count) + "\xD7" + to_string(
        model.current_multiplier
      ) + "] +" + to_string(multiplied_points);
    } else {
      return "\u25C9 DATA SCANNER [" + to_string(point_orbs_count) + " SAMPLES] +" + to_string(
        point_orbs_count
      );
    }
  } else {
    let $ = model.point_orbs_pulled_this_level;
    if ($ instanceof Empty) {
      return "\u21BA DATA RECOVERY [NO DATA SAMPLES TO RECOVER]";
    } else {
      let pulled_points = $;
      let _block;
      let _pipe = pulled_points;
      let _pipe$1 = sort(_pipe, compare2);
      _block = first(_pipe$1);
      let min_value = _block;
      if (min_value instanceof Ok) {
        let value = min_value[0];
        return "\u21BA DATA RECOVERY [POINT(" + to_string(value) + ") RESTORED TO CONTAINER]";
      } else {
        return "\u21BA DATA RECOVERY [NO DATA SAMPLES TO RECOVER]";
      }
    }
  }
}
function get_orb_result_color(orb) {
  if (orb instanceof Bomb) {
    return "default";
  } else if (orb instanceof Point) {
    return "gray";
  } else if (orb instanceof Health) {
    return "green";
  } else if (orb instanceof Collector) {
    return "blue";
  } else if (orb instanceof Survivor) {
    return "purple";
  } else if (orb instanceof Multiplier) {
    return "yellow";
  } else if (orb instanceof Choice) {
    return "orange";
  } else if (orb instanceof Gamble) {
    return "red";
  } else if (orb instanceof PointScanner) {
    return "blue";
  } else {
    return "green";
  }
}
function handle_gamble_orb(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    new GamblingChoice(),
    _record.last_orb,
    _record.bombs_pulled_this_level,
    _record.current_multiplier,
    _record.credits,
    _record.shuffle_enabled,
    _record.dev_mode,
    _record.testing_config,
    _record.testing_mode,
    _record.testing_stats,
    _record.log_entries,
    _record.log_sequence,
    _record.pending_choice,
    new Some(true),
    _record.gamble_orbs,
    _record.gamble_current_index,
    _record.in_gamble_choice,
    _record.point_orbs_pulled_this_level
  );
}
function draw_second_non_choice_orb(loop$model, loop$remaining_bag, loop$more_choice_orbs, loop$first_orb, loop$original_choice_orbs) {
  while (true) {
    let model = loop$model;
    let remaining_bag = loop$remaining_bag;
    let more_choice_orbs = loop$more_choice_orbs;
    let first_orb = loop$first_orb;
    let original_choice_orbs = loop$original_choice_orbs;
    if (remaining_bag instanceof Empty) {
      let _record = model;
      return new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        (() => {
          let _pipe = original_choice_orbs;
          return append(_pipe, more_choice_orbs);
        })(),
        new ChoosingOrb(),
        _record.last_orb,
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        _record.log_entries,
        _record.log_sequence,
        new Some([first_orb, first_orb]),
        _record.pending_gamble,
        _record.gamble_orbs,
        _record.gamble_current_index,
        _record.in_gamble_choice,
        _record.point_orbs_pulled_this_level
      );
    } else {
      let $ = remaining_bag.head;
      if ($ instanceof Choice) {
        let rest = remaining_bag.tail;
        loop$model = model;
        loop$remaining_bag = rest;
        loop$more_choice_orbs = (() => {
          let _pipe = more_choice_orbs;
          return append(_pipe, toList([new Choice()]));
        })();
        loop$first_orb = first_orb;
        loop$original_choice_orbs = original_choice_orbs;
      } else {
        let second_orb = $;
        let rest = remaining_bag.tail;
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          (() => {
            let _pipe = rest;
            let _pipe$1 = append(_pipe, original_choice_orbs);
            return append(_pipe$1, more_choice_orbs);
          })(),
          new ChoosingOrb(),
          _record.last_orb,
          _record.bombs_pulled_this_level,
          _record.current_multiplier,
          _record.credits,
          _record.shuffle_enabled,
          _record.dev_mode,
          _record.testing_config,
          _record.testing_mode,
          _record.testing_stats,
          _record.log_entries,
          _record.log_sequence,
          new Some([first_orb, second_orb]),
          _record.pending_gamble,
          _record.gamble_orbs,
          _record.gamble_current_index,
          _record.in_gamble_choice,
          _record.point_orbs_pulled_this_level
        );
      }
    }
  }
}
function draw_two_non_choice_orbs(loop$model, loop$remaining_bag, loop$choice_orbs_found) {
  while (true) {
    let model = loop$model;
    let remaining_bag = loop$remaining_bag;
    let choice_orbs_found = loop$choice_orbs_found;
    if (remaining_bag instanceof Empty) {
      let _record = model;
      return new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        choice_orbs_found,
        _record.status,
        _record.last_orb,
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        _record.log_entries,
        _record.log_sequence,
        _record.pending_choice,
        _record.pending_gamble,
        _record.gamble_orbs,
        _record.gamble_current_index,
        _record.in_gamble_choice,
        _record.point_orbs_pulled_this_level
      );
    } else {
      let $ = remaining_bag.head;
      if ($ instanceof Choice) {
        let rest = remaining_bag.tail;
        loop$model = model;
        loop$remaining_bag = rest;
        loop$choice_orbs_found = (() => {
          let _pipe = choice_orbs_found;
          return append(_pipe, toList([new Choice()]));
        })();
      } else {
        let $1 = remaining_bag.tail;
        if ($1 instanceof Empty) {
          let single_orb = $;
          let _record = model;
          return new Model(
            _record.health,
            _record.points,
            _record.level,
            _record.milestone,
            choice_orbs_found,
            new ChoosingOrb(),
            _record.last_orb,
            _record.bombs_pulled_this_level,
            _record.current_multiplier,
            _record.credits,
            _record.shuffle_enabled,
            _record.dev_mode,
            _record.testing_config,
            _record.testing_mode,
            _record.testing_stats,
            _record.log_entries,
            _record.log_sequence,
            new Some([single_orb, single_orb]),
            _record.pending_gamble,
            _record.gamble_orbs,
            _record.gamble_current_index,
            _record.in_gamble_choice,
            _record.point_orbs_pulled_this_level
          );
        } else {
          let $2 = $1.head;
          if ($2 instanceof Choice) {
            let first_orb = $;
            let rest = $1.tail;
            return draw_second_non_choice_orb(
              model,
              rest,
              toList([new Choice()]),
              first_orb,
              choice_orbs_found
            );
          } else {
            let first_orb = $;
            let second_orb = $2;
            let rest = $1.tail;
            let _record = model;
            return new Model(
              _record.health,
              _record.points,
              _record.level,
              _record.milestone,
              (() => {
                let _pipe = rest;
                return append(_pipe, choice_orbs_found);
              })(),
              new ChoosingOrb(),
              _record.last_orb,
              _record.bombs_pulled_this_level,
              _record.current_multiplier,
              _record.credits,
              _record.shuffle_enabled,
              _record.dev_mode,
              _record.testing_config,
              _record.testing_mode,
              _record.testing_stats,
              _record.log_entries,
              _record.log_sequence,
              new Some([first_orb, second_orb]),
              _record.pending_gamble,
              _record.gamble_orbs,
              _record.gamble_current_index,
              _record.in_gamble_choice,
              _record.point_orbs_pulled_this_level
            );
          }
        }
      }
    }
  }
}
function handle_choice_orb(model) {
  let $ = model.bag;
  if ($ instanceof Empty) {
    return model;
  } else {
    let $1 = $.tail;
    if ($1 instanceof Empty) {
      let single_orb = $.head;
      let _record = model;
      return new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        toList([]),
        new ChoosingOrb(),
        _record.last_orb,
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        _record.log_entries,
        _record.log_sequence,
        new Some([single_orb, single_orb]),
        _record.pending_gamble,
        _record.gamble_orbs,
        _record.gamble_current_index,
        _record.in_gamble_choice,
        _record.point_orbs_pulled_this_level
      );
    } else {
      return draw_two_non_choice_orbs(model, model.bag, toList([]));
    }
  }
}
function get_orb_name(orb) {
  if (orb instanceof Bomb) {
    let damage = orb[0];
    return "Hazard Sample (-" + to_string(damage) + " health)";
  } else if (orb instanceof Point) {
    let value = orb[0];
    return "Data Sample (+" + to_string(value) + ")";
  } else if (orb instanceof Health) {
    let value = orb[0];
    return "Medical Sample (+" + to_string(value) + " health)";
  } else if (orb instanceof Collector) {
    return "Scanner Sample";
  } else if (orb instanceof Survivor) {
    return "Analyzer Sample";
  } else if (orb instanceof Multiplier) {
    return "Amplifier Sample";
  } else if (orb instanceof Choice) {
    return "Choice Sample";
  } else if (orb instanceof Gamble) {
    return "Gamble Sample";
  } else if (orb instanceof PointScanner) {
    return "Data Scanner Sample";
  } else {
    return "Data Recovery Sample";
  }
}
function remove_first_occurrence(list4, target) {
  if (list4 instanceof Empty) {
    return toList([]);
  } else {
    let first2 = list4.head;
    let rest = list4.tail;
    let $ = first2 === target;
    if ($) {
      return rest;
    } else {
      return prepend(first2, remove_first_occurrence(rest, target));
    }
  }
}
function apply_orb_effect(orb, model) {
  if (orb instanceof Bomb) {
    let damage = orb[0];
    let _record = model;
    return new Model(
      model.health - damage,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      model.bombs_pulled_this_level + 1,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Point) {
    let value = orb[0];
    let multiplied_points = value * model.current_multiplier;
    let _record = model;
    return new Model(
      _record.health,
      model.points + multiplied_points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      prepend(value, model.point_orbs_pulled_this_level)
    );
  } else if (orb instanceof Health) {
    let value = orb[0];
    let new_health = min(5, model.health + value);
    let _record = model;
    return new Model(
      new_health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Collector) {
    let remaining_orbs = (() => {
      let _pipe = model.bag;
      return length(_pipe);
    })() - 1;
    let collector_points = remaining_orbs * model.current_multiplier;
    let _record = model;
    return new Model(
      _record.health,
      model.points + collector_points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Survivor) {
    let survivor_points = model.bombs_pulled_this_level * model.current_multiplier;
    let _record = model;
    return new Model(
      _record.health,
      model.points + survivor_points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Multiplier) {
    let new_multiplier = model.current_multiplier * 2;
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      new_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Choice) {
    return handle_choice_orb(model);
  } else if (orb instanceof Gamble) {
    return handle_gamble_orb(model);
  } else if (orb instanceof PointScanner) {
    let _block;
    let _pipe = model.bag;
    _block = count(
      _pipe,
      (orb2) => {
        if (orb2 instanceof Point) {
          return true;
        } else {
          return false;
        }
      }
    );
    let point_orbs_count = _block;
    let scanner_points = point_orbs_count * model.current_multiplier;
    let _record = model;
    return new Model(
      _record.health,
      model.points + scanner_points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else {
    let $ = model.point_orbs_pulled_this_level;
    if ($ instanceof Empty) {
      return model;
    } else {
      let pulled_points = $;
      let _block;
      let _pipe = pulled_points;
      let _pipe$1 = sort(_pipe, compare2);
      _block = first(_pipe$1);
      let min_value = _block;
      if (min_value instanceof Ok) {
        let value = min_value[0];
        let _block$1;
        let _pipe$2 = model.bag;
        _block$1 = append(_pipe$2, toList([new Point(value)]));
        let updated_bag = _block$1;
        let updated_tracking = remove_first_occurrence(pulled_points, value);
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          updated_bag,
          _record.status,
          _record.last_orb,
          _record.bombs_pulled_this_level,
          _record.current_multiplier,
          _record.credits,
          _record.shuffle_enabled,
          _record.dev_mode,
          _record.testing_config,
          _record.testing_mode,
          _record.testing_stats,
          _record.log_entries,
          _record.log_sequence,
          _record.pending_choice,
          _record.pending_gamble,
          _record.gamble_orbs,
          _record.gamble_current_index,
          _record.in_gamble_choice,
          updated_tracking
        );
      } else {
        return model;
      }
    }
  }
}

// build/dev/javascript/newmoon/marketplace.mjs
function get_market_items() {
  return toList([
    new MarketItem(new Point(8), 12, "Basic data packet - reliable points"),
    new MarketItem(new Point(12), 18, "Advanced data packet - higher value"),
    new MarketItem(new Point(15), 25, "Premium data packet - maximum value"),
    new MarketItem(new Health(2), 15, "Standard repair kit - moderate healing"),
    new MarketItem(new Health(4), 28, "Enhanced repair kit - superior healing"),
    new MarketItem(new Health(5), 40, "Emergency repair kit - full restoration"),
    new MarketItem(
      new Collector(),
      30,
      "Deep scanner - points for remaining samples"
    ),
    new MarketItem(
      new PointScanner(),
      25,
      "Data scanner - points for each data sample"
    ),
    new MarketItem(
      new PointRecovery(),
      35,
      "Data recovery - restore lowest pulled data sample"
    ),
    new MarketItem(
      new Survivor(),
      35,
      "Damage analyzer - points for bombs survived"
    ),
    new MarketItem(
      new Multiplier(),
      45,
      "Signal amplifier - doubles point multiplier"
    ),
    new MarketItem(
      new Choice(),
      50,
      "Choice protocol - select optimal sample from two"
    ),
    new MarketItem(
      new Gamble(),
      75,
      "High risk gamble - draw 5 orbs with point boost"
    )
  ]);
}
function can_afford(model, item) {
  return model.credits >= item.price;
}
function purchase_orb(model, orb) {
  let market_items = get_market_items();
  let $ = (() => {
    let _pipe = market_items;
    return find2(_pipe, (item) => {
      return isEqual(item.orb, orb);
    });
  })();
  if ($ instanceof Ok) {
    let item = $[0];
    let $1 = can_afford(model, item);
    if ($1) {
      let new_credits = model.credits - item.price;
      let new_bag = prepend(orb, model.bag);
      let _record = model;
      return new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        new_bag,
        _record.status,
        _record.last_orb,
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        new_credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        _record.log_entries,
        _record.log_sequence,
        _record.pending_choice,
        _record.pending_gamble,
        _record.gamble_orbs,
        _record.gamble_current_index,
        _record.in_gamble_choice,
        _record.point_orbs_pulled_this_level
      );
    } else {
      return model;
    }
  } else {
    return model;
  }
}
function view_market_item(model, item) {
  let can_buy = can_afford(model, item);
  let _block;
  if (can_buy) {
    _block = "bg-purple-600 hover:bg-purple-700 text-white";
  } else {
    _block = "bg-gray-300 cursor-not-allowed text-gray-500";
  }
  let button_classes = _block;
  let _block$1;
  if (can_buy) {
    _block$1 = "text-purple-600";
  } else {
    _block$1 = "text-red-500";
  }
  let price_color = _block$1;
  return div(
    toList([class$("bg-white border border-gray-200 rounded p-4")]),
    toList([
      div(
        toList([class$("text-left mb-3")]),
        toList([
          h3(
            toList([class$("font-medium text-gray-800 mb-1")]),
            toList([text3(get_orb_name(item.orb))])
          ),
          p(
            toList([class$("text-xs text-gray-600 mb-2")]),
            toList([text3(item.description)])
          ),
          p(
            toList([class$("text-sm font-light " + price_color)]),
            toList([
              text3("Cost: " + to_string(item.price) + " credits")
            ])
          )
        ])
      ),
      button(
        toList([
          class$(
            concat2(
              toList([
                "w-full py-4 px-6 rounded text-sm font-light transition transform hover:scale-[1.02] tracking-wider ",
                button_classes
              ])
            )
          ),
          on_click(new BuyOrb(item.orb))
        ]),
        toList([
          text3(
            (() => {
              if (can_buy) {
                return "PURCHASE";
              } else {
                return "INSUFFICIENT CREDITS";
              }
            })()
          )
        ])
      )
    ])
  );
}
function view_marketplace(model) {
  let market_items = get_market_items();
  return div(
    toList([class$("text-center")]),
    toList([
      div(
        toList([
          class$(
            "mb-6 p-6 bg-purple-50 border border-purple-200 rounded"
          )
        ]),
        toList([
          h2(
            toList([
              class$(
                "text-xl font-light text-black mb-2 tracking-wide"
              )
            ]),
            toList([text3("ORBITAL MARKETPLACE")])
          ),
          p(
            toList([
              class$("text-purple-700 text-sm font-light mb-2")
            ]),
            toList([text3("Enhance your exploration capabilities")])
          ),
          p(
            toList([class$("text-purple-600 text-xs font-light")]),
            toList([
              text3("Credits available: " + to_string(model.credits))
            ])
          )
        ])
      ),
      div(
        toList([class$("space-y-3 mb-6 max-h-64 overflow-y-auto")]),
        (() => {
          let _pipe = market_items;
          return map(
            _pipe,
            (item) => {
              return view_market_item(model, item);
            }
          );
        })()
      ),
      div(
        toList([class$("space-y-3")]),
        toList([
          button(
            toList([
              class$(
                "w-full bg-black hover:bg-gray-800 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
              ),
              on_click(new NextLevel())
            ]),
            toList([text3("ADVANCE TO NEXT SECTOR")])
          ),
          button(
            toList([
              class$(
                "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-light py-2 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new GoToMainMenu())
            ]),
            toList([text3("MAIN MENU")])
          )
        ])
      )
    ])
  );
}

// build/dev/javascript/newmoon/simulation.mjs
function apply_orb_simulation(orb, health, points, multiplier, bombs_hit) {
  if (orb instanceof Bomb) {
    let damage = orb[0];
    let new_health = health - damage;
    let new_bombs = bombs_hit + 1;
    return [new_health, points, multiplier, new_bombs];
  } else if (orb instanceof Point) {
    let value = orb[0];
    let modified_points = points + value * multiplier;
    return [health, modified_points, multiplier, bombs_hit];
  } else if (orb instanceof Health) {
    let value = orb[0];
    let new_health = health + value;
    return [new_health, points, multiplier, bombs_hit];
  } else if (orb instanceof Collector) {
    let collector_points = 5 * multiplier;
    return [health, points + collector_points, multiplier, bombs_hit];
  } else if (orb instanceof Survivor) {
    let survivor_points = bombs_hit * 2 * multiplier;
    return [health, points + survivor_points, multiplier, bombs_hit];
  } else if (orb instanceof Multiplier) {
    let new_multiplier = multiplier * 2;
    return [health, points, new_multiplier, bombs_hit];
  } else if (orb instanceof Choice) {
    return [health, points, multiplier, bombs_hit];
  } else if (orb instanceof Gamble) {
    return [health, points, multiplier, bombs_hit];
  } else if (orb instanceof PointScanner) {
    let scanner_points = 3 * multiplier;
    return [health, points + scanner_points, multiplier, bombs_hit];
  } else {
    return [health, points, multiplier, bombs_hit];
  }
}
function simulate_game(loop$bag, loop$health, loop$points, loop$target, loop$orbs_pulled, loop$bombs_hit, loop$multiplier) {
  while (true) {
    let bag = loop$bag;
    let health = loop$health;
    let points = loop$points;
    let target = loop$target;
    let orbs_pulled = loop$orbs_pulled;
    let bombs_hit = loop$bombs_hit;
    let multiplier = loop$multiplier;
    let $ = health <= 0;
    if ($) {
      return new SimulationResult(false, points, health, orbs_pulled, bombs_hit);
    } else {
      let $1 = points >= target;
      if ($1) {
        return new SimulationResult(
          true,
          points,
          health,
          orbs_pulled,
          bombs_hit
        );
      } else {
        if (bag instanceof Empty) {
          return new SimulationResult(
            false,
            points,
            health,
            orbs_pulled,
            bombs_hit
          );
        } else {
          let orb = bag.head;
          let rest = bag.tail;
          let $2 = apply_orb_simulation(
            orb,
            health,
            points,
            multiplier,
            bombs_hit
          );
          let new_health = $2[0];
          let new_points = $2[1];
          let new_multiplier = $2[2];
          let new_bombs = $2[3];
          loop$bag = rest;
          loop$health = new_health;
          loop$points = new_points;
          loop$target = target;
          loop$orbs_pulled = orbs_pulled + 1;
          loop$bombs_hit = new_bombs;
          loop$multiplier = new_multiplier;
        }
      }
    }
  }
}
function run_single_simulation(config) {
  let _block;
  let _pipe = config.test_bag;
  _block = shuffle(_pipe);
  let shuffled_bag = _block;
  return simulate_game(
    shuffled_bag,
    config.starting_health,
    0,
    config.target_milestone,
    0,
    0,
    1
  );
}
function calculate_stats(results) {
  let _block;
  let _pipe = results;
  _block = length(_pipe);
  let total_runs = _block;
  let _block$1;
  let _pipe$1 = results;
  _block$1 = count(_pipe$1, (result) => {
    return result.won;
  });
  let wins = _block$1;
  let losses = total_runs - wins;
  let _block$2;
  let $ = total_runs > 0;
  if ($) {
    _block$2 = divideFloat(identity(wins), identity(total_runs));
  } else {
    _block$2 = 0;
  }
  let win_rate = _block$2;
  let _block$3;
  let _pipe$2 = results;
  _block$3 = map(_pipe$2, (result) => {
    return result.final_points;
  });
  let point_values = _block$3;
  let _block$4;
  let $1 = total_runs > 0;
  if ($1) {
    let _block$52;
    let _pipe$3 = point_values;
    _block$52 = fold(_pipe$3, 0, add2);
    let total_points = _block$52;
    _block$4 = divideFloat(
      identity(total_points),
      identity(total_runs)
    );
  } else {
    _block$4 = 0;
  }
  let average_points = _block$4;
  let _block$5;
  let $2 = (() => {
    let _pipe$3 = point_values;
    let _pipe$4 = sort(_pipe$3, compare2);
    return reverse(_pipe$4);
  })();
  if ($2 instanceof Empty) {
    _block$5 = 0;
  } else {
    let best = $2.head;
    _block$5 = best;
  }
  let best_score = _block$5;
  let _block$6;
  let $3 = (() => {
    let _pipe$3 = point_values;
    return sort(_pipe$3, compare2);
  })();
  if ($3 instanceof Empty) {
    _block$6 = 0;
  } else {
    let worst = $3.head;
    _block$6 = worst;
  }
  let worst_score = _block$6;
  return new TestingStats(
    total_runs,
    wins,
    losses,
    win_rate,
    average_points,
    best_score,
    worst_score,
    results
  );
}
function run_simulations(config) {
  let _block;
  let _pipe = config.simulation_count;
  let _pipe$1 = ((_capture) => {
    return range(1, _capture);
  })(_pipe);
  _block = map(_pipe$1, (_) => {
    return run_single_simulation(config);
  });
  let results = _block;
  return calculate_stats(results);
}

// build/dev/javascript/newmoon/view.mjs
var OrbBoxStyle = class extends CustomType {
  constructor(background, border, icon, text4, symbol) {
    super();
    this.background = background;
    this.border = border;
    this.icon = icon;
    this.text = text4;
    this.symbol = symbol;
  }
};
function view_header() {
  return div(
    toList([]),
    toList([
      h1(
        toList([
          class$("text-3xl font-light text-black mb-2 tracking-wide")
        ]),
        toList([text3("NEW MOON")])
      ),
      p(
        toList([
          class$(
            "text-sm text-gray-500 mb-6 font-light tracking-wider"
          )
        ]),
        toList([text3("DEEP SPACE EXPLORATION")])
      )
    ])
  );
}
function view_stat_card(symbol, label2, value, color_class) {
  return div(
    toList([class$("bg-gray-50 rounded border border-gray-100 p-4")]),
    toList([
      div(
        toList([class$("text-lg font-light mb-1")]),
        toList([text3(symbol)])
      ),
      div(
        toList([
          class$(
            "text-xs text-gray-400 uppercase tracking-widest mb-1 font-light"
          )
        ]),
        toList([text3(label2)])
      ),
      div(
        toList([
          class$(
            concat2(toList(["text-2xl font-light ", color_class]))
          )
        ]),
        toList([text3(value)])
      )
    ])
  );
}
function view_result_card(message, color, centered) {
  let base_classes = "mb-4 p-3 rounded";
  let _block;
  if (centered) {
    _block = " text-center";
  } else {
    _block = "";
  }
  let center_class = _block;
  let _block$1;
  if (color === "gray") {
    _block$1 = " bg-gray-50 border border-gray-200";
  } else if (color === "green") {
    _block$1 = " bg-green-50 border border-green-200";
  } else if (color === "blue") {
    _block$1 = " bg-blue-50 border border-blue-200";
  } else if (color === "purple") {
    _block$1 = " bg-purple-50 border border-purple-200";
  } else if (color === "yellow") {
    _block$1 = " bg-yellow-50 border border-yellow-200";
  } else {
    _block$1 = " bg-gray-100 border border-gray-300";
  }
  let color_classes = _block$1;
  let _block$2;
  if (color === "gray") {
    _block$2 = "text-gray-700";
  } else if (color === "green") {
    _block$2 = "text-green-700";
  } else if (color === "blue") {
    _block$2 = "text-blue-700";
  } else if (color === "purple") {
    _block$2 = "text-purple-700";
  } else if (color === "yellow") {
    _block$2 = "text-yellow-700";
  } else {
    _block$2 = "text-gray-800";
  }
  let text_color_class = _block$2;
  return div(
    toList([class$(base_classes + color_classes + center_class)]),
    toList([
      p(
        toList([class$(text_color_class + " font-light text-sm")]),
        toList([text3(message)])
      )
    ])
  );
}
function view_multiplier_status(model) {
  let $ = model.current_multiplier > 1;
  if ($) {
    return view_result_card(
      "\u2731 SIGNAL AMPLIFICATION ACTIVE: " + to_string(
        model.current_multiplier
      ) + "\xD7 DATA BOOST",
      "yellow",
      true
    );
  } else {
    return div(toList([]), toList([]));
  }
}
function view_game_stats(model) {
  return div(
    toList([]),
    toList([
      div(
        toList([class$("grid grid-cols-2 gap-3 mb-3")]),
        toList([
          view_stat_card(
            "\u25CB",
            "SYSTEMS",
            to_string(model.health),
            "text-black"
          ),
          view_stat_card(
            "\u25CF",
            "DATA",
            to_string(model.points),
            "text-gray-700"
          )
        ])
      ),
      div(
        toList([class$("grid grid-cols-3 gap-2 mb-4")]),
        toList([
          view_stat_card(
            "\u25CE",
            "TARGET",
            to_string(model.milestone),
            "text-gray-600"
          ),
          view_stat_card(
            "\u25C9",
            "SECTOR",
            to_string(model.level),
            "text-gray-500"
          ),
          view_stat_card(
            "\u25C8",
            "CREDITS",
            to_string(model.credits),
            "text-purple-600"
          )
        ])
      ),
      view_multiplier_status(model)
    ])
  );
}
function view_specimens_panel(orbs_left) {
  return div(
    toList([class$("text-center")]),
    toList([
      p(
        toList([
          class$(
            "text-gray-500 mb-2 text-xs font-light tracking-wide"
          )
        ]),
        toList([text3("SAMPLE CONTAINER")])
      ),
      p(
        toList([class$("text-2xl font-light text-black")]),
        toList([text3(concat2(toList([to_string(orbs_left)])))])
      )
    ])
  );
}
function get_orb_box_style(orb) {
  if (orb instanceof Bomb) {
    return new OrbBoxStyle(
      "bg-white",
      "border-red-200",
      "text-red-600",
      "text-red-700",
      "\u26A0"
    );
  } else if (orb instanceof Point) {
    return new OrbBoxStyle(
      "bg-white",
      "border-blue-200",
      "text-blue-600",
      "text-blue-700",
      "\u25CF"
    );
  } else if (orb instanceof Health) {
    return new OrbBoxStyle(
      "bg-white",
      "border-green-200",
      "text-green-600",
      "text-green-700",
      "\u2665"
    );
  } else if (orb instanceof Collector) {
    return new OrbBoxStyle(
      "bg-white",
      "border-purple-200",
      "text-purple-600",
      "text-purple-700",
      "\u25CE"
    );
  } else if (orb instanceof Survivor) {
    return new OrbBoxStyle(
      "bg-white",
      "border-yellow-200",
      "text-yellow-600",
      "text-yellow-700",
      "\u25C8"
    );
  } else if (orb instanceof Multiplier) {
    return new OrbBoxStyle(
      "bg-white",
      "border-indigo-200",
      "text-indigo-600",
      "text-indigo-700",
      "\u2731"
    );
  } else if (orb instanceof Choice) {
    return new OrbBoxStyle(
      "bg-white",
      "border-orange-200",
      "text-orange-600",
      "text-orange-700",
      "\u25C6"
    );
  } else if (orb instanceof Gamble) {
    return new OrbBoxStyle(
      "bg-white",
      "border-red-200",
      "text-red-600",
      "text-red-700",
      "\u{1F3B2}"
    );
  } else if (orb instanceof PointScanner) {
    return new OrbBoxStyle(
      "bg-white",
      "border-cyan-200",
      "text-cyan-600",
      "text-cyan-700",
      "\u25C9"
    );
  } else {
    return new OrbBoxStyle(
      "bg-white",
      "border-green-200",
      "text-green-600",
      "text-green-700",
      "\u21BA"
    );
  }
}
function view_orb_box(last_orb) {
  if (last_orb instanceof Some) {
    let orb = last_orb[0];
    let orb_style = get_orb_box_style(orb);
    return div(
      toList([
        class$(
          "w-full h-16 rounded flex flex-col items-center justify-center border-2 bg-black transition-colors duration-700 " + orb_style.border
        ),
        style("background-color", "white")
      ]),
      toList([
        div(
          toList([class$("text-lg " + orb_style.icon)]),
          toList([text3(orb_style.symbol)])
        ),
        p(
          toList([class$("text-xs font-light " + orb_style.text)]),
          toList([text3(get_orb_name(orb))])
        )
      ])
    );
  } else {
    return div(
      toList([
        class$(
          "w-full h-16 bg-gray-200 border-2 border-dashed border-gray-300 rounded flex items-center justify-center"
        )
      ]),
      toList([
        p(
          toList([class$("text-xs text-gray-400 font-light")]),
          toList([text3("No sample yet")])
        )
      ])
    );
  }
}
function view_recent_orb_panel(model) {
  return div(
    toList([class$("text-center")]),
    toList([
      p(
        toList([
          class$(
            "text-gray-500 mb-2 text-xs font-light tracking-wide"
          )
        ]),
        toList([text3("RECENT SAMPLE")])
      ),
      view_orb_box(model.last_orb)
    ])
  );
}
function view_bag_info(model) {
  let _block;
  let _pipe = model.bag;
  _block = length(_pipe);
  let orbs_left = _block;
  return div(
    toList([
      class$("mb-6 p-4 bg-gray-50 rounded border border-gray-100")
    ]),
    toList([
      div(
        toList([class$("grid grid-cols-2 gap-4")]),
        toList([view_recent_orb_panel(model), view_specimens_panel(orbs_left)])
      )
    ])
  );
}
function view_shuffle_toggle_button(model) {
  let _block;
  let $ = model.shuffle_enabled;
  if ($) {
    _block = "SHUFFLE: ON";
  } else {
    _block = "SHUFFLE: OFF";
  }
  let toggle_text = _block;
  let _block$1;
  let $1 = model.shuffle_enabled;
  if ($1) {
    _block$1 = "bg-yellow-100 border-yellow-300 text-yellow-700";
  } else {
    _block$1 = "bg-gray-100 border-gray-300 text-gray-700";
  }
  let toggle_color = _block$1;
  return button(
    toList([
      class$(
        concat2(
          toList([
            "py-2 px-3 rounded border font-light text-xs tracking-wider transition ",
            toggle_color
          ])
        )
      ),
      on_click(new ToggleShuffle())
    ]),
    toList([text3(toggle_text)])
  );
}
function view_dev_mode_toggle_button(model) {
  let _block;
  let $ = model.dev_mode;
  if ($) {
    _block = "DEV: ON";
  } else {
    _block = "DEV: OFF";
  }
  let toggle_text = _block;
  let _block$1;
  let $1 = model.dev_mode;
  if ($1) {
    _block$1 = "bg-orange-100 border-orange-300 text-orange-700";
  } else {
    _block$1 = "bg-gray-100 border-gray-300 text-gray-700";
  }
  let toggle_color = _block$1;
  return button(
    toList([
      class$(
        concat2(
          toList([
            "py-2 px-3 rounded border font-light text-xs tracking-wider transition ",
            toggle_color
          ])
        )
      ),
      on_click(new ToggleDevMode())
    ]),
    toList([text3(toggle_text)])
  );
}
function view_game_toggles(model) {
  return div(
    toList([class$("mb-4 grid grid-cols-2 gap-3")]),
    toList([
      view_shuffle_toggle_button(model),
      view_dev_mode_toggle_button(model)
    ])
  );
}
function view_gambling_choice_state(_) {
  return div(
    toList([class$("text-center")]),
    toList([
      div(
        toList([
          class$("mb-6 p-6 bg-red-50 border border-red-200 rounded")
        ]),
        toList([
          h2(
            toList([
              class$(
                "text-xl font-light text-black mb-2 tracking-wide"
              )
            ]),
            toList([text3("GAMBLE PROTOCOL ACTIVATED")])
          ),
          p(
            toList([class$("text-red-700 text-sm font-light mb-4")]),
            toList([
              text3(
                "Draw 5 orbs simultaneously. Point orbs get 2X multiplier. High risk, high reward."
              )
            ])
          )
        ])
      ),
      div(
        toList([class$("space-y-3")]),
        toList([
          button(
            toList([
              class$(
                "w-full bg-red-600 hover:bg-red-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
              ),
              on_click(new AcceptGamble())
            ]),
            toList([text3("ACCEPT GAMBLE")])
          ),
          button(
            toList([
              class$(
                "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-light py-3 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new DeclineGamble())
            ]),
            toList([text3("DECLINE GAMBLE")])
          )
        ])
      )
    ])
  );
}
function get_short_orb_name(orb) {
  if (orb instanceof Bomb) {
    let damage = orb[0];
    return "Hazard\n(-" + to_string(damage) + ")";
  } else if (orb instanceof Point) {
    let value = orb[0];
    return "Data\n(+" + to_string(value) + ")";
  } else if (orb instanceof Health) {
    let value = orb[0];
    return "Medical\n(+" + to_string(value) + ")";
  } else if (orb instanceof Collector) {
    return "Scanner";
  } else if (orb instanceof Survivor) {
    return "Analyzer";
  } else if (orb instanceof Multiplier) {
    return "Amplifier";
  } else if (orb instanceof Choice) {
    return "Choice";
  } else if (orb instanceof Gamble) {
    return "Gamble";
  } else if (orb instanceof PointScanner) {
    return "Data\nScanner";
  } else {
    return "Data\nRecovery";
  }
}
function view_large_orb_box(orb_option) {
  if (orb_option instanceof Some) {
    let orb = orb_option[0];
    let orb_style = get_orb_box_style(orb);
    return div(
      toList([
        class$(
          "w-24 h-24 rounded flex flex-col items-center justify-center border-2 bg-white transition-colors duration-700 " + orb_style.border
        )
      ]),
      toList([
        div(
          toList([class$("text-xl mb-1 " + orb_style.icon)]),
          toList([text3(orb_style.symbol)])
        ),
        p(
          toList([
            class$(
              "text-xs font-light text-center leading-tight " + orb_style.text
            )
          ]),
          toList([text3(get_short_orb_name(orb))])
        )
      ])
    );
  } else {
    return div(
      toList([
        class$(
          "w-24 h-24 bg-gray-200 border-2 border-dashed border-gray-300 rounded flex items-center justify-center"
        )
      ]),
      toList([
        p(
          toList([class$("text-xs text-gray-400 font-light")]),
          toList([text3("Empty")])
        )
      ])
    );
  }
}
function view_large_orb_box_with_progress(orb_option, index3, current_index) {
  let _block;
  let $ = index3 <= current_index;
  if ($) {
    _block = " opacity-50";
  } else {
    _block = "";
  }
  let opacity_class = _block;
  if (orb_option instanceof Some) {
    let orb = orb_option[0];
    let orb_style = get_orb_box_style(orb);
    return div(
      toList([
        class$(
          "w-24 h-24 rounded flex flex-col items-center justify-center border-2 bg-white transition-colors duration-700 " + orb_style.border + opacity_class
        )
      ]),
      toList([
        div(
          toList([class$("text-xl mb-1 " + orb_style.icon)]),
          toList([text3(orb_style.symbol)])
        ),
        p(
          toList([
            class$(
              "text-xs font-light text-center leading-tight " + orb_style.text
            )
          ]),
          toList([text3(get_short_orb_name(orb))])
        )
      ])
    );
  } else {
    return div(
      toList([
        class$(
          "w-24 h-24 bg-gray-200 border-2 border-dashed border-gray-300 rounded flex items-center justify-center" + opacity_class
        )
      ]),
      toList([
        p(
          toList([class$("text-xs text-gray-400 font-light")]),
          toList([text3("Empty")])
        )
      ])
    );
  }
}
function list_at(loop$list, loop$index) {
  while (true) {
    let list4 = loop$list;
    let index3 = loop$index;
    if (list4 instanceof Empty) {
      return new None();
    } else if (index3 === 0) {
      let first2 = list4.head;
      return new Some(first2);
    } else {
      let n = index3;
      if (n > 0) {
        let rest = list4.tail;
        loop$list = rest;
        loop$index = n - 1;
      } else {
        return new None();
      }
    }
  }
}
function view_gamble_orbs_dice_pattern(orbs) {
  return div(
    toList([class$("mb-6")]),
    toList([
      div(
        toList([class$("flex justify-center gap-4 mb-3")]),
        toList([
          view_large_orb_box(list_at(orbs, 0)),
          view_large_orb_box(list_at(orbs, 1))
        ])
      ),
      div(
        toList([class$("flex justify-center gap-4")]),
        toList([
          view_large_orb_box(list_at(orbs, 2)),
          view_large_orb_box(list_at(orbs, 3)),
          view_large_orb_box(list_at(orbs, 4))
        ])
      )
    ])
  );
}
function view_gamble_results_state(model) {
  return div(
    toList([class$("text-center")]),
    toList([
      div(
        toList([
          class$("mb-6 p-6 bg-red-50 border border-red-200 rounded")
        ]),
        toList([
          h2(
            toList([
              class$(
                "text-xl font-light text-black mb-2 tracking-wide"
              )
            ]),
            toList([text3("GAMBLE RESULTS")])
          ),
          p(
            toList([class$("text-red-700 text-sm font-light mb-4")]),
            toList([
              text3(
                "5 orbs drawn. Click 'Start Applying' to apply effects one by one."
              )
            ])
          )
        ])
      ),
      view_gamble_orbs_dice_pattern(model.gamble_orbs),
      button(
        toList([
          class$(
            "w-full bg-red-600 hover:bg-red-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
          ),
          on_click(new NextGambleOrb())
        ]),
        toList([text3("START APPLYING EFFECTS")])
      )
    ])
  );
}
function view_gamble_orbs_dice_pattern_with_progress(orbs, current_index) {
  return div(
    toList([class$("mb-6")]),
    toList([
      div(
        toList([class$("flex justify-center gap-4 mb-3")]),
        toList([
          view_large_orb_box_with_progress(list_at(orbs, 0), 0, current_index),
          view_large_orb_box_with_progress(list_at(orbs, 1), 1, current_index)
        ])
      ),
      div(
        toList([class$("flex justify-center gap-4")]),
        toList([
          view_large_orb_box_with_progress(list_at(orbs, 2), 2, current_index),
          view_large_orb_box_with_progress(list_at(orbs, 3), 3, current_index),
          view_large_orb_box_with_progress(list_at(orbs, 4), 4, current_index)
        ])
      )
    ])
  );
}
function view_applying_gamble_orbs_state(model) {
  return div(
    toList([class$("text-center")]),
    toList([
      div(
        toList([
          class$("mb-6 p-6 bg-red-50 border border-red-200 rounded")
        ]),
        toList([
          h2(
            toList([
              class$(
                "text-xl font-light text-black mb-2 tracking-wide"
              )
            ]),
            toList([text3("APPLYING GAMBLE EFFECTS")])
          ),
          p(
            toList([class$("text-red-700 text-sm font-light mb-4")]),
            toList([
              text3(
                "Orb " + to_string(model.gamble_current_index + 1) + " of " + to_string(
                  length(model.gamble_orbs)
                )
              )
            ])
          )
        ])
      ),
      view_gamble_orbs_dice_pattern_with_progress(
        model.gamble_orbs,
        model.gamble_current_index
      ),
      button(
        toList([
          class$(
            "w-full bg-red-600 hover:bg-red-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
          ),
          on_click(new NextGambleOrb())
        ]),
        toList([text3("NEXT ORB")])
      )
    ])
  );
}
function view_choice_option(orb, select_msg, is_single) {
  let orb_style = get_orb_box_style(orb);
  let _block;
  if (is_single) {
    _block = "w-full max-w-xs mx-auto";
  } else {
    _block = "w-full";
  }
  let button_width = _block;
  return button(
    toList([
      class$(
        concat2(
          toList([
            button_width,
            " p-4 rounded border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ",
            orb_style.background,
            " ",
            orb_style.border
          ])
        )
      ),
      on_click(select_msg)
    ]),
    toList([
      div(
        toList([class$("flex flex-col items-center")]),
        toList([
          div(
            toList([class$("text-2xl mb-2 " + orb_style.icon)]),
            toList([text3(orb_style.symbol)])
          ),
          p(
            toList([class$("text-sm font-medium " + orb_style.text)]),
            toList([text3(get_orb_name(orb))])
          )
        ])
      )
    ])
  );
}
function view_choice_selection(first_orb, second_orb) {
  let $ = isEqual(first_orb, second_orb);
  if ($) {
    return div(
      toList([class$("space-y-4")]),
      toList([
        p(
          toList([class$("text-sm text-gray-600 mb-4")]),
          toList([text3("Only one sample available:")])
        ),
        view_choice_option(first_orb, new SelectFirstChoice(), true)
      ])
    );
  } else {
    return div(
      toList([class$("space-y-4")]),
      toList([
        p(
          toList([class$("text-sm text-gray-600 mb-4")]),
          toList([text3("Choose one sample to extract:")])
        ),
        div(
          toList([class$("grid grid-cols-2 gap-4")]),
          toList([
            view_choice_option(first_orb, new SelectFirstChoice(), false),
            view_choice_option(second_orb, new SelectSecondChoice(), false)
          ])
        )
      ])
    );
  }
}
function view_choosing_orb_state(model) {
  let _block;
  let $ = model.in_gamble_choice;
  if ($) {
    _block = "GAMBLE CHOICE PROTOCOL";
  } else {
    _block = "CHOICE PROTOCOL ACTIVATED";
  }
  let header_text = _block;
  let _block$1;
  let $1 = model.in_gamble_choice;
  if ($1) {
    _block$1 = "Choice orb during gamble! Select one sample from beyond the gamble sequence.";
  } else {
    _block$1 = "Select one sample to extract. The other will return to your container.";
  }
  let description_text = _block$1;
  let _block$2;
  let $2 = model.in_gamble_choice;
  if ($2) {
    _block$2 = "bg-red-50 border border-red-200";
  } else {
    _block$2 = "bg-orange-50 border border-orange-200";
  }
  let color_classes = _block$2;
  let _block$3;
  let $3 = model.in_gamble_choice;
  if ($3) {
    _block$3 = "text-red-700";
  } else {
    _block$3 = "text-orange-700";
  }
  let text_color_class = _block$3;
  return div(
    toList([class$("text-center")]),
    toList([
      div(
        toList([class$("mb-6 p-6 " + color_classes + " rounded")]),
        toList([
          h2(
            toList([
              class$(
                "text-xl font-light text-black mb-2 tracking-wide"
              )
            ]),
            toList([text3(header_text)])
          ),
          p(
            toList([
              class$(text_color_class + " text-sm font-light mb-4")
            ]),
            toList([text3(description_text)])
          )
        ])
      ),
      (() => {
        let $4 = model.pending_choice;
        if ($4 instanceof Some) {
          let first_orb = $4[0][0];
          let second_orb = $4[0][1];
          return view_choice_selection(first_orb, second_orb);
        } else {
          return div(
            toList([class$("p-4 bg-gray-50 rounded border")]),
            toList([
              p(
                toList([class$("text-gray-600")]),
                toList([text3("No samples available for selection")])
              )
            ])
          );
        }
      })()
    ])
  );
}
function view_log_header() {
  return div(
    toList([class$("mb-2")]),
    toList([
      h3(
        toList([
          class$(
            "text-xs font-medium text-gray-600 uppercase tracking-wider"
          )
        ]),
        toList([text3("EXTRACTION LOG")])
      )
    ])
  );
}
function view_log_entry(entry) {
  let orb_color = get_orb_result_color(entry.orb);
  let _block;
  if (orb_color === "gray") {
    _block = "text-gray-700";
  } else if (orb_color === "green") {
    _block = "text-green-700";
  } else if (orb_color === "blue") {
    _block = "text-blue-700";
  } else if (orb_color === "purple") {
    _block = "text-purple-700";
  } else if (orb_color === "yellow") {
    _block = "text-yellow-700";
  } else {
    _block = "text-red-700";
  }
  let text_color_class = _block;
  return div(
    toList([class$("text-xs")]),
    toList([
      span(
        toList([class$("text-gray-500 mr-2")]),
        toList([text3("#" + to_string(entry.sequence))])
      ),
      span(toList([class$("mr-2")]), toList([text3("\u2192")])),
      span(
        toList([class$(text_color_class + " font-medium")]),
        toList([text3(entry.message)])
      )
    ])
  );
}
function view_log_entries(entries) {
  let _block;
  let _pipe = entries;
  _block = take(_pipe, 4);
  let visible_entries = _block;
  return div(
    toList([
      class$(
        "bg-gray-50 border border-gray-200 rounded p-3 max-h-20 overflow-y-auto"
      )
    ]),
    toList([
      div(
        toList([class$("space-y-1")]),
        (() => {
          let _pipe$1 = visible_entries;
          return map(_pipe$1, view_log_entry);
        })()
      )
    ])
  );
}
function view_extraction_log(model) {
  let $ = (() => {
    let _pipe = model.log_entries;
    return is_empty(_pipe);
  })();
  if ($) {
    return div(toList([]), toList([]));
  } else {
    return div(
      toList([class$("mb-4")]),
      toList([view_log_header(), view_log_entries(model.log_entries)])
    );
  }
}
function view_pull_orb_button(model) {
  let _block;
  let _pipe = model.bag;
  _block = is_empty(_pipe);
  let is_disabled = _block;
  let _block$1;
  if (is_disabled) {
    _block$1 = "bg-gray-200 cursor-not-allowed text-gray-400 border-gray-200";
  } else {
    _block$1 = "bg-black hover:bg-gray-800 text-white border-black hover:scale-[1.02] active:scale-95";
  }
  let button_classes = _block$1;
  return button(
    toList([
      class$(
        concat2(
          toList([
            "w-full py-4 px-6 rounded border font-light text-sm tracking-wider transition-all duration-150 transform ",
            button_classes
          ])
        )
      ),
      on_click(new PullOrb())
    ]),
    toList([text3("EXTRACT SAMPLE")])
  );
}
function view_main_menu(model) {
  let has_progress = model.level > 1 || model.credits > 0;
  return div(
    toList([class$("text-center")]),
    toList([
      div(
        toList([class$("mb-8")]),
        toList([
          h1(
            toList([
              class$(
                "text-4xl font-light text-black mb-2 tracking-wider"
              )
            ]),
            toList([text3("NEW MOON")])
          ),
          p(
            toList([
              class$(
                "text-lg text-gray-500 mb-2 font-light tracking-wide"
              )
            ]),
            toList([text3("DEEP SPACE EXPLORATION")])
          ),
          p(
            toList([
              class$(
                "text-sm text-gray-400 font-light tracking-wider"
              )
            ]),
            toList([
              text3("Extract samples \u2022 Manage risk \u2022 Survive the unknown")
            ])
          )
        ])
      ),
      div(
        toList([class$("space-y-4")]),
        toList([
          button(
            toList([
              class$(
                "w-full bg-black hover:bg-gray-800 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
              ),
              on_click(new StartNewGame())
            ]),
            toList([text3("START NEW MISSION")])
          ),
          (() => {
            if (has_progress) {
              return button(
                toList([
                  class$(
                    "w-full bg-blue-600 hover:bg-blue-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
                  ),
                  on_click(new ContinueGame())
                ]),
                toList([text3("CONTINUE MISSION")])
              );
            } else {
              return div(toList([]), toList([]));
            }
          })(),
          button(
            toList([
              class$(
                "w-full bg-purple-600 hover:bg-purple-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
              ),
              on_click(new GoToTestingGrounds())
            ]),
            toList([text3("FIELD TESTING")])
          ),
          button(
            toList([
              class$(
                "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-light py-3 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new ShowHowToPlay())
            ]),
            toList([text3("HOW TO PLAY")])
          )
        ])
      ),
      (() => {
        if (has_progress) {
          return div(
            toList([class$("mt-6 p-3 bg-gray-50 rounded border")]),
            toList([
              p(
                toList([class$("text-xs text-gray-600")]),
                toList([
                  text3(
                    "Progress: Sector " + to_string(model.level) + " \u2022 Credits: " + to_string(
                      model.credits
                    )
                  )
                ])
              )
            ])
          );
        } else {
          return div(toList([]), toList([]));
        }
      })()
    ])
  );
}
function view_paused_state(_) {
  return div(
    toList([class$("text-center")]),
    toList([
      div(
        toList([
          class$(
            "mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded"
          )
        ]),
        toList([
          h2(
            toList([
              class$(
                "text-xl font-light text-black mb-2 tracking-wide"
              )
            ]),
            toList([text3("MISSION PAUSED")])
          ),
          p(
            toList([class$("text-yellow-700 text-sm font-light")]),
            toList([
              text3("Your progress is safe. Choose your next action.")
            ])
          )
        ])
      ),
      div(
        toList([class$("space-y-3")]),
        toList([
          button(
            toList([
              class$(
                "w-full bg-green-600 hover:bg-green-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
              ),
              on_click(new ResumeGame())
            ]),
            toList([text3("RESUME MISSION")])
          ),
          button(
            toList([
              class$(
                "w-full bg-blue-600 hover:bg-blue-700 text-white font-light py-3 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new RestartLevel())
            ]),
            toList([text3("RESTART SECTOR")])
          ),
          button(
            toList([
              class$(
                "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-light py-3 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new GoToMainMenu())
            ]),
            toList([text3("MAIN MENU")])
          )
        ])
      )
    ])
  );
}
function view_level_complete_state(model) {
  return div(
    toList([class$("text-center")]),
    toList([
      div(
        toList([
          class$(
            "mb-6 p-6 bg-green-50 border border-green-200 rounded"
          )
        ]),
        toList([
          h2(
            toList([
              class$(
                "text-2xl font-light text-black mb-4 tracking-wide"
              )
            ]),
            toList([
              text3(
                "SECTOR " + to_string(model.level) + " COMPLETE"
              )
            ])
          ),
          div(
            toList([class$("mb-4")]),
            toList([
              p(
                toList([
                  class$("text-green-700 text-lg font-medium mb-2")
                ]),
                toList([text3("Mission successful!")])
              ),
              p(
                toList([class$("text-gray-600 text-sm mb-1")]),
                toList([
                  text3(
                    "Target achieved: " + to_string(model.milestone) + " data units"
                  )
                ])
              ),
              p(
                toList([class$("text-gray-600 text-sm")]),
                toList([
                  text3(
                    "Final score: " + to_string(model.points) + " points"
                  )
                ])
              )
            ])
          ),
          p(
            toList([
              class$("text-green-600 text-lg font-medium mb-2")
            ]),
            toList([
              text3("Credits earned: +" + to_string(model.points))
            ])
          ),
          p(
            toList([class$("text-purple-600 text-sm font-light")]),
            toList([
              text3("Total credits: " + to_string(model.credits))
            ])
          )
        ])
      ),
      div(
        toList([class$("space-y-3")]),
        toList([
          button(
            toList([
              class$(
                "w-full bg-black hover:bg-gray-800 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
              ),
              on_click(new NextLevel())
            ]),
            toList([
              text3("ADVANCE TO SECTOR " + to_string(model.level + 1))
            ])
          ),
          button(
            toList([
              class$(
                "w-full bg-purple-600 hover:bg-purple-700 text-white font-light py-3 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new GoToMarketplace())
            ]),
            toList([text3("VISIT MARKETPLACE")])
          ),
          button(
            toList([
              class$(
                "w-full bg-blue-600 hover:bg-blue-700 text-white font-light py-3 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new GoToTestingGrounds())
            ]),
            toList([text3("FIELD TESTING")])
          ),
          button(
            toList([
              class$(
                "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-light py-2 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new GoToMainMenu())
            ]),
            toList([text3("MAIN MENU")])
          )
        ])
      )
    ])
  );
}
function view_game_over_state(model) {
  return div(
    toList([class$("text-center")]),
    toList([
      div(
        toList([
          class$("mb-6 p-6 bg-red-50 border border-red-200 rounded")
        ]),
        toList([
          h2(
            toList([
              class$(
                "text-xl font-light text-black mb-2 tracking-wide"
              )
            ]),
            toList([text3("MISSION FAILED")])
          ),
          p(
            toList([class$("text-red-700 text-sm font-light mb-3")]),
            toList([text3("All systems compromised. Mission terminated.")])
          ),
          div(
            toList([class$("text-sm text-gray-600")]),
            toList([
              p(
                toList([class$("mb-1")]),
                toList([text3("Sector: " + to_string(model.level))])
              ),
              p(
                toList([class$("mb-1")]),
                toList([
                  text3(
                    "Final score: " + to_string(model.points) + " / " + to_string(
                      model.milestone
                    )
                  )
                ])
              ),
              p(
                toList([]),
                toList([
                  text3(
                    "Credits retained: " + to_string(model.credits)
                  )
                ])
              )
            ])
          )
        ])
      ),
      div(
        toList([class$("space-y-3")]),
        toList([
          button(
            toList([
              class$(
                "w-full bg-red-600 hover:bg-red-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
              ),
              on_click(new RestartLevel())
            ]),
            toList([text3("RETRY SECTOR " + to_string(model.level))])
          ),
          button(
            toList([
              class$(
                "w-full bg-blue-600 hover:bg-blue-700 text-white font-light py-3 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new GoToTestingGrounds())
            ]),
            toList([text3("ANALYZE IN FIELD TESTING")])
          ),
          button(
            toList([
              class$(
                "w-full bg-gray-600 hover:bg-gray-700 text-white font-light py-3 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new StartNewGame())
            ]),
            toList([text3("START NEW MISSION")])
          ),
          button(
            toList([
              class$(
                "w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-light py-2 px-6 rounded transition text-sm tracking-wider"
              ),
              on_click(new GoToMainMenu())
            ]),
            toList([text3("MAIN MENU")])
          )
        ])
      )
    ])
  );
}
function view_pause_button() {
  return div(
    toList([class$("flex justify-end mb-4")]),
    toList([
      button(
        toList([
          class$(
            "px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-light tracking-wider transition"
          ),
          on_click(new PauseGame())
        ]),
        toList([text3("\u23F8 PAUSE")])
      )
    ])
  );
}
function view_field_testing_header() {
  return div(
    toList([
      class$("mb-6 p-4 bg-blue-50 border border-blue-200 rounded")
    ]),
    toList([
      h2(
        toList([
          class$("text-xl font-light text-black mb-2 tracking-wide")
        ]),
        toList([text3("SAMPLE FIELD TESTING")])
      ),
      p(
        toList([class$("text-blue-700 text-sm font-light")]),
        toList([text3("Simulate strategies and optimize your approach")])
      ),
      button(
        toList([
          class$(
            "mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-light tracking-wider transition"
          ),
          on_click(new ExitTestingGrounds())
        ]),
        toList([text3("\u2190 BACK TO GAME")])
      )
    ])
  );
}
function view_simulation_progress(_) {
  return div(
    toList([class$("p-6")]),
    toList([
      div(
        toList([class$("mb-4")]),
        toList([
          h3(
            toList([class$("text-lg font-light mb-2")]),
            toList([text3("Running Simulations...")])
          ),
          p(
            toList([class$("text-gray-600 text-sm")]),
            toList([text3("Please wait while we test your strategy")])
          )
        ])
      ),
      div(
        toList([class$("bg-gray-200 rounded-full h-2 mb-4")]),
        toList([
          div(
            toList([class$("bg-blue-600 h-2 rounded-full w-1/2")]),
            toList([])
          )
        ])
      ),
      button(
        toList([
          class$(
            "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-light tracking-wider transition"
          ),
          on_click(new ViewTestResults())
        ]),
        toList([text3("VIEW RESULTS (DEMO)")])
      )
    ])
  );
}
function generate_insights(stats) {
  let _block;
  let $ = stats.win_rate;
  let rate = $;
  if (rate >= 0.8) {
    _block = "Excellent strategy! Very high success rate.";
  } else {
    let rate$1 = $;
    if (rate$1 >= 0.6) {
      _block = "Good strategy with solid win rate.";
    } else {
      let rate$2 = $;
      if (rate$2 >= 0.4) {
        _block = "Moderate success. Consider more health samples.";
      } else {
        _block = "Low win rate. Strategy needs significant improvement.";
      }
    }
  }
  let win_rate_insight = _block;
  let _block$1;
  let $1 = stats.average_points >= identity(
    round(identity(stats.best_score) * 0.7)
  );
  if ($1) {
    _block$1 = "Consistent scoring with good point generation.";
  } else {
    _block$1 = "High variance in scores. Strategy may be risky.";
  }
  let score_insight = _block$1;
  let _block$2;
  let $2 = stats.total_runs;
  let runs = $2;
  if (runs >= 100) {
    _block$2 = "Large sample size provides reliable results.";
  } else {
    let runs$1 = $2;
    if (runs$1 >= 50) {
      _block$2 = "Good sample size for meaningful insights.";
    } else {
      _block$2 = "Small sample size. Consider running more simulations.";
    }
  }
  let sample_insight = _block$2;
  return toList([win_rate_insight, score_insight, sample_insight]);
}
function view_performance_insights(stats) {
  let insights = generate_insights(stats);
  return div(
    toList([class$("bg-gray-50 rounded border p-4")]),
    toList([
      h4(
        toList([class$("text-sm font-medium text-gray-700 mb-2")]),
        toList([text3("STRATEGY INSIGHTS")])
      ),
      div(
        toList([class$("space-y-2")]),
        (() => {
          let _pipe = insights;
          return map(
            _pipe,
            (insight) => {
              return p(
                toList([class$("text-xs text-gray-600")]),
                toList([text3(insight)])
              );
            }
          );
        })()
      )
    ])
  );
}
function view_comprehensive_stats(stats) {
  let _block;
  let _pipe = stats.win_rate * 100;
  let _pipe$1 = round(_pipe);
  let _pipe$2 = to_string(_pipe$1);
  _block = append2(_pipe$2, "%");
  let win_rate_percent = _block;
  let _block$1;
  let _pipe$3 = stats.average_points;
  let _pipe$4 = round(_pipe$3);
  _block$1 = to_string(_pipe$4);
  let avg_points = _block$1;
  return div(
    toList([]),
    toList([
      div(
        toList([class$("grid grid-cols-2 gap-4 mb-6")]),
        toList([
          view_stat_card(
            "\u2713",
            "WIN RATE",
            win_rate_percent,
            (() => {
              let $ = stats.win_rate >= 0.7;
              if ($) {
                return "text-green-600";
              } else {
                let $1 = stats.win_rate >= 0.4;
                if ($1) {
                  return "text-yellow-600";
                } else {
                  return "text-red-600";
                }
              }
            })()
          ),
          view_stat_card("\u25CE", "AVG SCORE", avg_points, "text-blue-600")
        ])
      ),
      div(
        toList([class$("grid grid-cols-3 gap-3 mb-6")]),
        toList([
          view_stat_card(
            "\u25C8",
            "WINS",
            to_string(stats.wins),
            "text-green-600"
          ),
          view_stat_card(
            "\u25C7",
            "LOSSES",
            to_string(stats.losses),
            "text-red-600"
          ),
          view_stat_card(
            "\u26AC",
            "TOTAL",
            to_string(stats.total_runs),
            "text-gray-600"
          )
        ])
      ),
      div(
        toList([class$("grid grid-cols-2 gap-4 mb-6")]),
        toList([
          view_stat_card(
            "\u2191",
            "BEST",
            to_string(stats.best_score),
            "text-purple-600"
          ),
          view_stat_card(
            "\u2193",
            "WORST",
            to_string(stats.worst_score),
            "text-gray-500"
          )
        ])
      ),
      view_performance_insights(stats)
    ])
  );
}
function view_test_results(model) {
  let $ = model.testing_stats;
  if ($ instanceof Some) {
    let stats = $[0];
    return div(
      toList([class$("p-6")]),
      toList([
        h3(
          toList([class$("text-lg font-light mb-4")]),
          toList([text3("Simulation Results")])
        ),
        view_comprehensive_stats(stats),
        div(
          toList([class$("space-y-3 mt-6")]),
          toList([
            button(
              toList([
                class$(
                  "w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-light tracking-wider transition"
                ),
                on_click(new ResetTestConfig())
              ]),
              toList([text3("NEW TEST")])
            ),
            button(
              toList([
                class$(
                  "w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-light tracking-wider transition"
                ),
                on_click(new ExitTestingGrounds())
              ]),
              toList([text3("BACK TO GAME")])
            )
          ])
        )
      ])
    );
  } else {
    return div(
      toList([class$("p-6")]),
      toList([
        p(
          toList([class$("text-gray-600")]),
          toList([text3("No simulation results available")])
        )
      ])
    );
  }
}
function view_test_bag_contents(bag) {
  let $ = (() => {
    let _pipe = bag;
    return is_empty(_pipe);
  })();
  if ($) {
    return p(
      toList([class$("text-gray-400 text-sm italic")]),
      toList([text3("No samples added yet")])
    );
  } else {
    return div(
      toList([class$("flex flex-wrap gap-2")]),
      (() => {
        let _pipe = bag;
        return index_map(
          _pipe,
          (orb, index3) => {
            return div(
              toList([
                class$(
                  "flex items-center bg-white rounded border px-2 py-1"
                )
              ]),
              toList([
                span(
                  toList([class$("text-xs mr-2")]),
                  toList([text3(get_orb_name(orb))])
                ),
                button(
                  toList([
                    class$("text-red-500 hover:text-red-700 text-xs"),
                    on_click(new RemoveTestOrb(index3))
                  ]),
                  toList([text3("\xD7")])
                )
              ])
            );
          }
        );
      })()
    );
  }
}
function view_orb_selector() {
  let available_orbs = toList([
    new Point(8),
    new Point(12),
    new Point(15),
    new Health(2),
    new Health(4),
    new Bomb(2),
    new Bomb(3),
    new Collector(),
    new PointScanner(),
    new PointRecovery(),
    new Survivor(),
    new Multiplier(),
    new Choice(),
    new Gamble()
  ]);
  return div(
    toList([]),
    toList([
      p(
        toList([class$("text-sm font-light mb-2")]),
        toList([text3("Add samples to your test container:")])
      ),
      div(
        toList([class$("grid grid-cols-2 gap-2")]),
        (() => {
          let _pipe = available_orbs;
          return map(
            _pipe,
            (orb) => {
              return button(
                toList([
                  class$(
                    "px-3 py-2 bg-white hover:bg-gray-100 border rounded text-xs font-light transition"
                  ),
                  on_click(new AddTestOrb(orb))
                ]),
                toList([text3(get_orb_name(orb))])
              );
            }
          );
        })()
      )
    ])
  );
}
function view_test_bag_builder(config) {
  return div(
    toList([class$("mb-6")]),
    toList([
      h3(
        toList([class$("text-lg font-light mb-3")]),
        toList([text3("Test Sample Configuration")])
      ),
      div(
        toList([class$("mb-4 p-4 bg-gray-50 rounded border")]),
        toList([
          p(
            toList([class$("text-sm text-gray-600 mb-2")]),
            toList([
              text3(
                "Samples in container: " + (() => {
                  let _pipe = config.test_bag;
                  let _pipe$1 = length(_pipe);
                  return to_string(_pipe$1);
                })()
              )
            ])
          ),
          view_test_bag_contents(config.test_bag)
        ])
      ),
      view_orb_selector()
    ])
  );
}
function view_test_settings(config) {
  return div(
    toList([class$("mb-6 p-4 bg-gray-50 rounded border")]),
    toList([
      h3(
        toList([class$("text-lg font-light mb-3")]),
        toList([text3("Test Settings")])
      ),
      div(
        toList([class$("grid grid-cols-2 gap-4")]),
        toList([
          div(
            toList([]),
            toList([
              label(
                toList([class$("block text-sm font-light mb-1")]),
                toList([text3("Target Score:")])
              ),
              p(
                toList([class$("text-lg")]),
                toList([text3(to_string(config.target_milestone))])
              )
            ])
          ),
          div(
            toList([]),
            toList([
              label(
                toList([class$("block text-sm font-light mb-1")]),
                toList([text3("Starting Health:")])
              ),
              p(
                toList([class$("text-lg")]),
                toList([text3(to_string(config.starting_health))])
              )
            ])
          )
        ])
      ),
      div(
        toList([class$("mt-4")]),
        toList([
          label(
            toList([class$("block text-sm font-light mb-1")]),
            toList([text3("Simulation Count:")])
          ),
          p(
            toList([class$("text-lg")]),
            toList([text3(to_string(config.simulation_count))])
          )
        ])
      )
    ])
  );
}
function view_test_actions(config) {
  let _block;
  let _pipe = config.test_bag;
  let _pipe$1 = is_empty(_pipe);
  _block = /* @__PURE__ */ ((x) => {
    return !x;
  })(_pipe$1);
  let can_run = _block;
  let _block$1;
  if (can_run) {
    _block$1 = "bg-green-600 hover:bg-green-700 text-white";
  } else {
    _block$1 = "bg-gray-300 cursor-not-allowed text-gray-500";
  }
  let button_classes = _block$1;
  return div(
    toList([class$("space-y-3")]),
    toList([
      button(
        toList([
          class$(
            concat2(
              toList([
                "w-full py-4 px-6 rounded font-light text-sm tracking-wider transition transform hover:scale-[1.02] ",
                button_classes
              ])
            )
          ),
          on_click(new StartSimulations())
        ]),
        toList([
          text3(
            (() => {
              if (can_run) {
                return "RUN SIMULATIONS";
              } else {
                return "ADD SAMPLES TO BEGIN";
              }
            })()
          )
        ])
      ),
      button(
        toList([
          class$(
            "w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-light text-sm tracking-wider transition"
          ),
          on_click(new ResetTestConfig())
        ]),
        toList([text3("RESET CONFIGURATION")])
      )
    ])
  );
}
function view_test_configuration(model) {
  let $ = model.testing_config;
  if ($ instanceof Some) {
    let config = $[0];
    return div(
      toList([]),
      toList([
        view_test_bag_builder(config),
        view_test_settings(config),
        view_test_actions(config)
      ])
    );
  } else {
    return div(toList([]), toList([text3("Configuration error")]));
  }
}
function view_testing_grounds(model) {
  return div(
    toList([class$("text-center")]),
    toList([
      view_field_testing_header(),
      (() => {
        let $ = model.testing_mode;
        if ($ instanceof ConfiguringTest) {
          return view_test_configuration(model);
        } else if ($ instanceof RunningSimulations) {
          return view_simulation_progress(model);
        } else {
          return view_test_results(model);
        }
      })()
    ])
  );
}
function view_next_orb_preview(model) {
  let $ = model.bag;
  if ($ instanceof Empty) {
    return p(
      toList([class$("text-xs text-red-700 mb-1")]),
      toList([text3("Next: No samples remaining")])
    );
  } else {
    let next_orb = $.head;
    return p(
      toList([class$("text-xs text-red-700 mb-1")]),
      toList([text3("Next: " + get_orb_name(next_orb))])
    );
  }
}
function view_bag_order_display(model) {
  let $ = model.bag;
  if ($ instanceof Empty) {
    return p(
      toList([class$("text-xs text-red-600")]),
      toList([text3("Container: Empty")])
    );
  } else {
    let orbs = $;
    let _block;
    let _pipe = orbs;
    _block = map(_pipe, get_orb_name);
    let orb_names = _block;
    let _block$1;
    let _pipe$1 = orb_names;
    _block$1 = join(_pipe$1, ", ");
    let orb_list = _block$1;
    let _block$2;
    let $1 = (() => {
      let _pipe$2 = orb_list;
      return string_length(_pipe$2);
    })() > 60;
    if ($1) {
      let _pipe$2 = orb_list;
      let _pipe$3 = slice(_pipe$2, 0, 57);
      _block$2 = append2(_pipe$3, "...");
    } else {
      _block$2 = orb_list;
    }
    let display_text = _block$2;
    return p(
      toList([class$("text-xs text-red-600")]),
      toList([text3("Sample Order: " + display_text)])
    );
  }
}
function view_dev_mode_panel(model) {
  return div(
    toList([
      class$("mb-4 p-3 bg-red-50 border border-red-300 rounded")
    ]),
    toList([
      h3(
        toList([class$("text-sm font-medium text-red-800 mb-2")]),
        toList([text3("\u{1F527} DEV MODE ACTIVE")])
      ),
      view_next_orb_preview(model),
      view_bag_order_display(model)
    ])
  );
}
function view_playing_state(model) {
  return div(
    toList([]),
    toList([
      (() => {
        let $ = model.dev_mode;
        if ($) {
          return view_dev_mode_panel(model);
        } else {
          return div(toList([]), toList([]));
        }
      })(),
      view_pause_button(),
      view_bag_info(model),
      view_game_toggles(model),
      view_extraction_log(model),
      view_pull_orb_button(model)
    ])
  );
}
function view_game_content(model) {
  let $ = model.status;
  if ($ instanceof MainMenu) {
    return view_main_menu(model);
  } else if ($ instanceof Playing) {
    return view_playing_state(model);
  } else if ($ instanceof Paused) {
    return view_paused_state(model);
  } else if ($ instanceof LevelComplete) {
    return view_level_complete_state(model);
  } else if ($ instanceof GameOver) {
    return view_game_over_state(model);
  } else if ($ instanceof InMarketplace) {
    return view_marketplace(model);
  } else if ($ instanceof InTestingGrounds) {
    return view_testing_grounds(model);
  } else if ($ instanceof ChoosingOrb) {
    return view_choosing_orb_state(model);
  } else if ($ instanceof GamblingChoice) {
    return view_gambling_choice_state(model);
  } else if ($ instanceof ViewingGambleResults) {
    return view_gamble_results_state(model);
  } else {
    return view_applying_gamble_orbs_state(model);
  }
}
function view_game_card(model) {
  return div(
    toList([
      class$(
        "bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center border border-gray-200"
      )
    ]),
    (() => {
      let $ = model.status;
      if ($ instanceof Playing) {
        return toList([
          view_header(),
          view_game_stats(model),
          view_game_content(model)
        ]);
      } else if ($ instanceof Paused) {
        return toList([
          view_header(),
          view_game_stats(model),
          view_game_content(model)
        ]);
      } else {
        return toList([view_game_content(model)]);
      }
    })()
  );
}
function view(model) {
  return div(
    toList([
      class$(
        "min-h-screen bg-gradient-to-br from-gray-500 via-black to-gray-800 flex items-center justify-center p-4"
      )
    ]),
    toList([view_game_card(model)])
  );
}

// build/dev/javascript/newmoon/newmoon.mjs
var FILEPATH = "src/newmoon.gleam";
function init(_) {
  return new Model(
    5,
    0,
    1,
    get_milestone_for_level(1),
    create_level_bag(1),
    new MainMenu(),
    new None(),
    0,
    1,
    0,
    false,
    false,
    new None(),
    new ConfiguringTest(),
    new None(),
    toList([]),
    0,
    new None(),
    new None(),
    toList([]),
    0,
    false,
    toList([])
  );
}
function handle_next_level(model) {
  let new_level = model.level + 1;
  let base_bag = create_level_bag(new_level);
  let _block;
  let $ = model.shuffle_enabled;
  if ($) {
    let _pipe = base_bag;
    _block = shuffle(_pipe);
  } else {
    _block = base_bag;
  }
  let final_bag = _block;
  return new Model(
    5,
    0,
    new_level,
    get_milestone_for_level(new_level),
    final_bag,
    new Playing(),
    new None(),
    0,
    1,
    model.credits,
    model.shuffle_enabled,
    model.dev_mode,
    model.testing_config,
    model.testing_mode,
    model.testing_stats,
    toList([]),
    0,
    new None(),
    new None(),
    toList([]),
    0,
    false,
    toList([])
  );
}
function handle_enter_testing_grounds(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    new InTestingGrounds(),
    _record.last_orb,
    _record.bombs_pulled_this_level,
    _record.current_multiplier,
    _record.credits,
    _record.shuffle_enabled,
    _record.dev_mode,
    new Some(new TestingConfiguration(toList([]), 50, 5, 100)),
    new ConfiguringTest(),
    new None(),
    _record.log_entries,
    _record.log_sequence,
    _record.pending_choice,
    _record.pending_gamble,
    _record.gamble_orbs,
    _record.gamble_current_index,
    _record.in_gamble_choice,
    _record.point_orbs_pulled_this_level
  );
}
function handle_add_test_orb(model, orb) {
  let $ = model.testing_config;
  if ($ instanceof Some) {
    let config = $[0];
    let _block;
    let _record = config;
    _block = new TestingConfiguration(
      prepend(orb, config.test_bag),
      _record.target_milestone,
      _record.starting_health,
      _record.simulation_count
    );
    let new_config = _block;
    let _record$1 = model;
    return new Model(
      _record$1.health,
      _record$1.points,
      _record$1.level,
      _record$1.milestone,
      _record$1.bag,
      _record$1.status,
      _record$1.last_orb,
      _record$1.bombs_pulled_this_level,
      _record$1.current_multiplier,
      _record$1.credits,
      _record$1.shuffle_enabled,
      _record$1.dev_mode,
      new Some(new_config),
      _record$1.testing_mode,
      _record$1.testing_stats,
      _record$1.log_entries,
      _record$1.log_sequence,
      _record$1.pending_choice,
      _record$1.pending_gamble,
      _record$1.gamble_orbs,
      _record$1.gamble_current_index,
      _record$1.in_gamble_choice,
      _record$1.point_orbs_pulled_this_level
    );
  } else {
    return model;
  }
}
function handle_remove_test_orb(model, index3) {
  let $ = model.testing_config;
  if ($ instanceof Some) {
    let config = $[0];
    let _block;
    let _pipe = config.test_bag;
    _block = take(_pipe, index3);
    let before = _block;
    let _block$1;
    let _pipe$1 = config.test_bag;
    _block$1 = drop(_pipe$1, index3 + 1);
    let after = _block$1;
    let _block$2;
    let _pipe$2 = before;
    _block$2 = append(_pipe$2, after);
    let new_bag = _block$2;
    let _block$3;
    let _record = config;
    _block$3 = new TestingConfiguration(
      new_bag,
      _record.target_milestone,
      _record.starting_health,
      _record.simulation_count
    );
    let new_config = _block$3;
    let _record$1 = model;
    return new Model(
      _record$1.health,
      _record$1.points,
      _record$1.level,
      _record$1.milestone,
      _record$1.bag,
      _record$1.status,
      _record$1.last_orb,
      _record$1.bombs_pulled_this_level,
      _record$1.current_multiplier,
      _record$1.credits,
      _record$1.shuffle_enabled,
      _record$1.dev_mode,
      new Some(new_config),
      _record$1.testing_mode,
      _record$1.testing_stats,
      _record$1.log_entries,
      _record$1.log_sequence,
      _record$1.pending_choice,
      _record$1.pending_gamble,
      _record$1.gamble_orbs,
      _record$1.gamble_current_index,
      _record$1.in_gamble_choice,
      _record$1.point_orbs_pulled_this_level
    );
  } else {
    return model;
  }
}
function handle_set_test_milestone(model, milestone) {
  let $ = model.testing_config;
  if ($ instanceof Some) {
    let config = $[0];
    let _block;
    let _record = config;
    _block = new TestingConfiguration(
      _record.test_bag,
      milestone,
      _record.starting_health,
      _record.simulation_count
    );
    let new_config = _block;
    let _record$1 = model;
    return new Model(
      _record$1.health,
      _record$1.points,
      _record$1.level,
      _record$1.milestone,
      _record$1.bag,
      _record$1.status,
      _record$1.last_orb,
      _record$1.bombs_pulled_this_level,
      _record$1.current_multiplier,
      _record$1.credits,
      _record$1.shuffle_enabled,
      _record$1.dev_mode,
      new Some(new_config),
      _record$1.testing_mode,
      _record$1.testing_stats,
      _record$1.log_entries,
      _record$1.log_sequence,
      _record$1.pending_choice,
      _record$1.pending_gamble,
      _record$1.gamble_orbs,
      _record$1.gamble_current_index,
      _record$1.in_gamble_choice,
      _record$1.point_orbs_pulled_this_level
    );
  } else {
    return model;
  }
}
function handle_set_test_health(model, health) {
  let $ = model.testing_config;
  if ($ instanceof Some) {
    let config = $[0];
    let _block;
    let _record = config;
    _block = new TestingConfiguration(
      _record.test_bag,
      _record.target_milestone,
      health,
      _record.simulation_count
    );
    let new_config = _block;
    let _record$1 = model;
    return new Model(
      _record$1.health,
      _record$1.points,
      _record$1.level,
      _record$1.milestone,
      _record$1.bag,
      _record$1.status,
      _record$1.last_orb,
      _record$1.bombs_pulled_this_level,
      _record$1.current_multiplier,
      _record$1.credits,
      _record$1.shuffle_enabled,
      _record$1.dev_mode,
      new Some(new_config),
      _record$1.testing_mode,
      _record$1.testing_stats,
      _record$1.log_entries,
      _record$1.log_sequence,
      _record$1.pending_choice,
      _record$1.pending_gamble,
      _record$1.gamble_orbs,
      _record$1.gamble_current_index,
      _record$1.in_gamble_choice,
      _record$1.point_orbs_pulled_this_level
    );
  } else {
    return model;
  }
}
function handle_set_simulation_count(model, count2) {
  let $ = model.testing_config;
  if ($ instanceof Some) {
    let config = $[0];
    let _block;
    let _record = config;
    _block = new TestingConfiguration(
      _record.test_bag,
      _record.target_milestone,
      _record.starting_health,
      count2
    );
    let new_config = _block;
    let _record$1 = model;
    return new Model(
      _record$1.health,
      _record$1.points,
      _record$1.level,
      _record$1.milestone,
      _record$1.bag,
      _record$1.status,
      _record$1.last_orb,
      _record$1.bombs_pulled_this_level,
      _record$1.current_multiplier,
      _record$1.credits,
      _record$1.shuffle_enabled,
      _record$1.dev_mode,
      new Some(new_config),
      _record$1.testing_mode,
      _record$1.testing_stats,
      _record$1.log_entries,
      _record$1.log_sequence,
      _record$1.pending_choice,
      _record$1.pending_gamble,
      _record$1.gamble_orbs,
      _record$1.gamble_current_index,
      _record$1.in_gamble_choice,
      _record$1.point_orbs_pulled_this_level
    );
  } else {
    return model;
  }
}
function handle_start_simulations(model) {
  let $ = model.testing_config;
  if ($ instanceof Some) {
    let config = $[0];
    let stats = run_simulations(config);
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      new ViewingResults(),
      new Some(stats),
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else {
    return model;
  }
}
function handle_view_test_results(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    _record.status,
    _record.last_orb,
    _record.bombs_pulled_this_level,
    _record.current_multiplier,
    _record.credits,
    _record.shuffle_enabled,
    _record.dev_mode,
    _record.testing_config,
    new ViewingResults(),
    _record.testing_stats,
    _record.log_entries,
    _record.log_sequence,
    _record.pending_choice,
    _record.pending_gamble,
    _record.gamble_orbs,
    _record.gamble_current_index,
    _record.in_gamble_choice,
    _record.point_orbs_pulled_this_level
  );
}
function handle_reset_test_config(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    _record.status,
    _record.last_orb,
    _record.bombs_pulled_this_level,
    _record.current_multiplier,
    _record.credits,
    _record.shuffle_enabled,
    _record.dev_mode,
    new Some(new TestingConfiguration(toList([]), 50, 5, 100)),
    new ConfiguringTest(),
    new None(),
    _record.log_entries,
    _record.log_sequence,
    _record.pending_choice,
    _record.pending_gamble,
    _record.gamble_orbs,
    _record.gamble_current_index,
    _record.in_gamble_choice,
    _record.point_orbs_pulled_this_level
  );
}
function start_new_game() {
  let base_bag = create_level_bag(1);
  return new Model(
    5,
    0,
    1,
    get_milestone_for_level(1),
    base_bag,
    new Playing(),
    new None(),
    0,
    1,
    0,
    false,
    false,
    new None(),
    new ConfiguringTest(),
    new None(),
    toList([]),
    0,
    new None(),
    new None(),
    toList([]),
    0,
    false,
    toList([])
  );
}
function restart_current_level(model) {
  let base_bag = create_level_bag(model.level);
  let _block;
  let $ = model.shuffle_enabled;
  if ($) {
    let _pipe = base_bag;
    _block = shuffle(_pipe);
  } else {
    _block = base_bag;
  }
  let final_bag = _block;
  return new Model(
    5,
    0,
    model.level,
    model.milestone,
    final_bag,
    new Playing(),
    new None(),
    0,
    1,
    model.credits,
    model.shuffle_enabled,
    model.dev_mode,
    model.testing_config,
    model.testing_mode,
    model.testing_stats,
    toList([]),
    0,
    new None(),
    new None(),
    toList([]),
    0,
    false,
    toList([])
  );
}
function handle_toggle_shuffle(model) {
  let new_shuffle_enabled = !model.shuffle_enabled;
  let $ = isEqual(model.status, new Playing()) && new_shuffle_enabled;
  if ($) {
    let _block;
    let _pipe = model.bag;
    _block = shuffle(_pipe);
    let shuffled_bag = _block;
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      shuffled_bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      new_shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      new_shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  }
}
function handle_accept_gamble(model) {
  let _block;
  let _pipe = model.bag;
  _block = take(_pipe, 5);
  let gamble_orbs = _block;
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    new ViewingGambleResults(),
    _record.last_orb,
    _record.bombs_pulled_this_level,
    _record.current_multiplier,
    _record.credits,
    _record.shuffle_enabled,
    _record.dev_mode,
    _record.testing_config,
    _record.testing_mode,
    _record.testing_stats,
    _record.log_entries,
    _record.log_sequence,
    _record.pending_choice,
    new None(),
    gamble_orbs,
    0,
    false,
    _record.point_orbs_pulled_this_level
  );
}
function handle_decline_gamble(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    new Playing(),
    _record.last_orb,
    _record.bombs_pulled_this_level,
    _record.current_multiplier,
    _record.credits,
    _record.shuffle_enabled,
    _record.dev_mode,
    _record.testing_config,
    _record.testing_mode,
    _record.testing_stats,
    _record.log_entries,
    _record.log_sequence,
    _record.pending_choice,
    new None(),
    _record.gamble_orbs,
    _record.gamble_current_index,
    _record.in_gamble_choice,
    _record.point_orbs_pulled_this_level
  );
}
function check_game_status(model) {
  let $ = model.health <= 0;
  let $1 = model.points >= model.milestone;
  if ($) {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      new GameOver(),
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if ($1) {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      new LevelComplete(),
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      model.credits + model.points,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else {
    return model;
  }
}
function handle_pull_orb(model) {
  let $ = model.status;
  if ($ instanceof Playing) {
    let $1 = model.bag;
    if ($1 instanceof Empty) {
      return model;
    } else {
      let first_orb = $1.head;
      let rest = $1.tail;
      let new_model = apply_orb_effect(first_orb, model);
      let new_sequence = model.log_sequence + 1;
      let log_message = get_orb_result_message(first_orb, new_model);
      let new_log_entry = new LogEntry(
        new_sequence,
        first_orb,
        log_message
      );
      let _block;
      let _record = new_model;
      _block = new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        rest,
        _record.status,
        new Some(first_orb),
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        prepend(new_log_entry, model.log_entries),
        new_sequence,
        _record.pending_choice,
        _record.pending_gamble,
        _record.gamble_orbs,
        _record.gamble_current_index,
        _record.in_gamble_choice,
        _record.point_orbs_pulled_this_level
      );
      let updated_model = _block;
      return check_game_status(updated_model);
    }
  } else {
    return model;
  }
}
function remove_first_occurrence2(list4, target) {
  if (list4 instanceof Empty) {
    return toList([]);
  } else {
    let first2 = list4.head;
    let rest = list4.tail;
    let $ = first2 === target;
    if ($) {
      return rest;
    } else {
      return prepend(first2, remove_first_occurrence2(rest, target));
    }
  }
}
function apply_gamble_orb_effect(orb, model) {
  if (orb instanceof Bomb) {
    let damage = orb[0];
    let _record = model;
    return new Model(
      model.health - damage,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      model.bombs_pulled_this_level + 1,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Point) {
    let value = orb[0];
    let gamble_points = value * 2 * model.current_multiplier;
    let _record = model;
    return new Model(
      _record.health,
      model.points + gamble_points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Health) {
    let value = orb[0];
    let new_health = min(5, model.health + value);
    let _record = model;
    return new Model(
      new_health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Collector) {
    let _block;
    let _pipe = model.bag;
    _block = length(_pipe);
    let remaining_orbs = _block;
    let collector_points = remaining_orbs * model.current_multiplier;
    let _record = model;
    return new Model(
      _record.health,
      model.points + collector_points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Survivor) {
    let survivor_points = model.bombs_pulled_this_level * model.current_multiplier;
    let _record = model;
    return new Model(
      _record.health,
      model.points + survivor_points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Multiplier) {
    let new_multiplier = model.current_multiplier * 2;
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      new_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (orb instanceof Choice) {
    let _block;
    let _pipe = model.bag;
    _block = drop(_pipe, 5);
    let orbs_after_gamble = _block;
    if (orbs_after_gamble instanceof Empty) {
      let gamble_points = 5 * 2 * model.current_multiplier;
      let _record = model;
      return new Model(
        _record.health,
        model.points + gamble_points,
        _record.level,
        _record.milestone,
        _record.bag,
        _record.status,
        _record.last_orb,
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        _record.log_entries,
        _record.log_sequence,
        _record.pending_choice,
        _record.pending_gamble,
        _record.gamble_orbs,
        _record.gamble_current_index,
        _record.in_gamble_choice,
        _record.point_orbs_pulled_this_level
      );
    } else {
      let $ = orbs_after_gamble.tail;
      if ($ instanceof Empty) {
        let single_orb = orbs_after_gamble.head;
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          _record.bag,
          new ChoosingOrb(),
          _record.last_orb,
          _record.bombs_pulled_this_level,
          _record.current_multiplier,
          _record.credits,
          _record.shuffle_enabled,
          _record.dev_mode,
          _record.testing_config,
          _record.testing_mode,
          _record.testing_stats,
          _record.log_entries,
          _record.log_sequence,
          new Some([single_orb, single_orb]),
          _record.pending_gamble,
          _record.gamble_orbs,
          _record.gamble_current_index,
          true,
          _record.point_orbs_pulled_this_level
        );
      } else {
        let first_orb = orbs_after_gamble.head;
        let second_orb = $.head;
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          _record.bag,
          new ChoosingOrb(),
          _record.last_orb,
          _record.bombs_pulled_this_level,
          _record.current_multiplier,
          _record.credits,
          _record.shuffle_enabled,
          _record.dev_mode,
          _record.testing_config,
          _record.testing_mode,
          _record.testing_stats,
          _record.log_entries,
          _record.log_sequence,
          new Some([first_orb, second_orb]),
          _record.pending_gamble,
          _record.gamble_orbs,
          _record.gamble_current_index,
          true,
          _record.point_orbs_pulled_this_level
        );
      }
    }
  } else if (orb instanceof Gamble) {
    return model;
  } else if (orb instanceof PointScanner) {
    let _block;
    let _pipe = model.bag;
    _block = count(
      _pipe,
      (orb2) => {
        if (orb2 instanceof Point) {
          return true;
        } else {
          return false;
        }
      }
    );
    let point_orbs_count = _block;
    let scanner_points = point_orbs_count * model.current_multiplier;
    let _record = model;
    return new Model(
      _record.health,
      model.points + scanner_points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else {
    let $ = model.point_orbs_pulled_this_level;
    if ($ instanceof Empty) {
      return model;
    } else {
      let pulled_points = $;
      let _block;
      let _pipe = pulled_points;
      let _pipe$1 = sort(_pipe, compare2);
      _block = first(_pipe$1);
      let min_value = _block;
      if (min_value instanceof Ok) {
        let value = min_value[0];
        let _block$1;
        let _pipe$2 = model.bag;
        _block$1 = append(_pipe$2, toList([new Point(value)]));
        let updated_bag = _block$1;
        let updated_tracking = remove_first_occurrence2(pulled_points, value);
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          updated_bag,
          _record.status,
          _record.last_orb,
          _record.bombs_pulled_this_level,
          _record.current_multiplier,
          _record.credits,
          _record.shuffle_enabled,
          _record.dev_mode,
          _record.testing_config,
          _record.testing_mode,
          _record.testing_stats,
          _record.log_entries,
          _record.log_sequence,
          _record.pending_choice,
          _record.pending_gamble,
          _record.gamble_orbs,
          _record.gamble_current_index,
          _record.in_gamble_choice,
          updated_tracking
        );
      } else {
        return model;
      }
    }
  }
}
function handle_choice_selection(model, select_first) {
  let $ = model.pending_choice;
  if ($ instanceof Some) {
    let first_orb = $[0][0];
    let second_orb = $[0][1];
    let _block;
    if (select_first) {
      _block = [first_orb, second_orb];
    } else {
      _block = [second_orb, first_orb];
    }
    let $1 = _block;
    let chosen_orb = $1[0];
    let unchosen_orb = $1[1];
    let $2 = model.in_gamble_choice;
    if ($2) {
      let after_effect = apply_gamble_orb_effect(chosen_orb, model);
      let new_sequence = model.log_sequence + 1;
      let log_message = get_orb_result_message(chosen_orb, after_effect);
      let new_log_entry = new LogEntry(
        new_sequence,
        chosen_orb,
        log_message
      );
      let _block$1;
      let _pipe = model.bag;
      _block$1 = drop(_pipe, 5);
      let orbs_after_gamble = _block$1;
      let _block$2;
      let $3 = isEqual(first_orb, second_orb);
      if ($3) {
        let _pipe$12 = orbs_after_gamble;
        _block$2 = drop(_pipe$12, 1);
      } else {
        let _pipe$12 = orbs_after_gamble;
        let _pipe$22 = drop(_pipe$12, 2);
        _block$2 = append(_pipe$22, toList([unchosen_orb]));
      }
      let remaining_after_gamble = _block$2;
      let _block$3;
      let _pipe$1 = model.bag;
      let _pipe$2 = take(_pipe$1, 5);
      _block$3 = append(_pipe$2, remaining_after_gamble);
      let new_bag = _block$3;
      let _block$4;
      let _record = after_effect;
      _block$4 = new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        new_bag,
        new ApplyingGambleOrbs(),
        new Some(chosen_orb),
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        prepend(new_log_entry, model.log_entries),
        new_sequence,
        new None(),
        _record.pending_gamble,
        _record.gamble_orbs,
        _record.gamble_current_index,
        false,
        _record.point_orbs_pulled_this_level
      );
      let updated_model = _block$4;
      return check_game_status(updated_model);
    } else {
      let after_effect = apply_orb_effect(chosen_orb, model);
      let new_sequence = model.log_sequence + 1;
      let log_message = get_orb_result_message(chosen_orb, after_effect);
      let new_log_entry = new LogEntry(
        new_sequence,
        chosen_orb,
        log_message
      );
      let _block$1;
      let $3 = isEqual(first_orb, second_orb);
      if ($3) {
        _block$1 = after_effect.bag;
      } else {
        let _pipe = after_effect.bag;
        _block$1 = append(_pipe, toList([unchosen_orb]));
      }
      let new_bag = _block$1;
      let _block$2;
      let _record = after_effect;
      _block$2 = new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        new_bag,
        new Playing(),
        new Some(chosen_orb),
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        prepend(new_log_entry, model.log_entries),
        new_sequence,
        new None(),
        _record.pending_gamble,
        _record.gamble_orbs,
        _record.gamble_current_index,
        _record.in_gamble_choice,
        _record.point_orbs_pulled_this_level
      );
      let updated_model = _block$2;
      return check_game_status(updated_model);
    }
  } else {
    return model;
  }
}
function apply_current_gamble_orb(model) {
  let $ = (() => {
    let _pipe = model.gamble_orbs;
    let _pipe$1 = drop(_pipe, model.gamble_current_index);
    return first(_pipe$1);
  })();
  if ($ instanceof Ok) {
    let orb = $[0];
    let _block;
    let _pipe = model.bag;
    _block = drop(_pipe, 1);
    let remaining_bag = _block;
    let _block$1;
    let _record = model;
    _block$1 = new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      remaining_bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
    let model_with_consumed_orb = _block$1;
    let modified_model = apply_gamble_orb_effect(orb, model_with_consumed_orb);
    let new_sequence = model.log_sequence + 1;
    let log_message = get_orb_result_message(orb, modified_model);
    let new_log_entry = new LogEntry(new_sequence, orb, log_message);
    let _block$2;
    let _record$1 = modified_model;
    _block$2 = new Model(
      _record$1.health,
      _record$1.points,
      _record$1.level,
      _record$1.milestone,
      _record$1.bag,
      _record$1.status,
      _record$1.last_orb,
      _record$1.bombs_pulled_this_level,
      _record$1.current_multiplier,
      _record$1.credits,
      _record$1.shuffle_enabled,
      _record$1.dev_mode,
      _record$1.testing_config,
      _record$1.testing_mode,
      _record$1.testing_stats,
      prepend(new_log_entry, model.log_entries),
      new_sequence,
      _record$1.pending_choice,
      _record$1.pending_gamble,
      _record$1.gamble_orbs,
      _record$1.gamble_current_index,
      _record$1.in_gamble_choice,
      _record$1.point_orbs_pulled_this_level
    );
    let updated_model = _block$2;
    return check_game_status(updated_model);
  } else {
    return model;
  }
}
function handle_next_gamble_orb(model) {
  let $ = model.status;
  if ($ instanceof ViewingGambleResults) {
    let $1 = model.gamble_orbs;
    if ($1 instanceof Empty) {
      let _record = model;
      return new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        _record.bag,
        new Playing(),
        _record.last_orb,
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        _record.log_entries,
        _record.log_sequence,
        _record.pending_choice,
        _record.pending_gamble,
        _record.gamble_orbs,
        _record.gamble_current_index,
        _record.in_gamble_choice,
        _record.point_orbs_pulled_this_level
      );
    } else {
      let _block;
      let _record = model;
      _block = new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        _record.bag,
        new ApplyingGambleOrbs(),
        _record.last_orb,
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        _record.log_entries,
        _record.log_sequence,
        _record.pending_choice,
        _record.pending_gamble,
        _record.gamble_orbs,
        0,
        false,
        _record.point_orbs_pulled_this_level
      );
      let updated_model = _block;
      return apply_current_gamble_orb(updated_model);
    }
  } else if ($ instanceof ApplyingGambleOrbs) {
    let next_index = model.gamble_current_index + 1;
    let $1 = next_index >= (() => {
      let _pipe = model.gamble_orbs;
      return length(_pipe);
    })();
    if ($1) {
      let _record = model;
      return new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        _record.bag,
        new Playing(),
        _record.last_orb,
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        _record.log_entries,
        _record.log_sequence,
        _record.pending_choice,
        _record.pending_gamble,
        toList([]),
        0,
        false,
        _record.point_orbs_pulled_this_level
      );
    } else {
      let _block;
      let _record = model;
      _block = new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        _record.bag,
        _record.status,
        _record.last_orb,
        _record.bombs_pulled_this_level,
        _record.current_multiplier,
        _record.credits,
        _record.shuffle_enabled,
        _record.dev_mode,
        _record.testing_config,
        _record.testing_mode,
        _record.testing_stats,
        _record.log_entries,
        _record.log_sequence,
        _record.pending_choice,
        _record.pending_gamble,
        _record.gamble_orbs,
        next_index,
        _record.in_gamble_choice,
        _record.point_orbs_pulled_this_level
      );
      let updated_model = _block;
      return apply_current_gamble_orb(updated_model);
    }
  } else {
    return model;
  }
}
function update2(model, msg) {
  if (msg instanceof StartNewGame) {
    return start_new_game();
  } else if (msg instanceof ContinueGame) {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      new Playing(),
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (msg instanceof ShowHowToPlay) {
    return model;
  } else if (msg instanceof PullOrb) {
    return handle_pull_orb(model);
  } else if (msg instanceof PauseGame) {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      new Paused(),
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (msg instanceof ResumeGame) {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      new Playing(),
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (msg instanceof NextLevel) {
    return handle_next_level(model);
  } else if (msg instanceof RestartLevel) {
    return restart_current_level(model);
  } else if (msg instanceof GoToMainMenu) {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      new MainMenu(),
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (msg instanceof GoToMarketplace) {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      new InMarketplace(),
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (msg instanceof GoToTestingGrounds) {
    return handle_enter_testing_grounds(model);
  } else if (msg instanceof AcceptLevelReward) {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      new LevelComplete(),
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (msg instanceof BuyOrb) {
    let orb = msg[0];
    return purchase_orb(model, orb);
  } else if (msg instanceof ToggleShuffle) {
    return handle_toggle_shuffle(model);
  } else if (msg instanceof ToggleDevMode) {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.status,
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      !model.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (msg instanceof SelectFirstChoice) {
    return handle_choice_selection(model, true);
  } else if (msg instanceof SelectSecondChoice) {
    return handle_choice_selection(model, false);
  } else if (msg instanceof AcceptGamble) {
    return handle_accept_gamble(model);
  } else if (msg instanceof DeclineGamble) {
    return handle_decline_gamble(model);
  } else if (msg instanceof NextGambleOrb) {
    return handle_next_gamble_orb(model);
  } else if (msg instanceof ExitTestingGrounds) {
    let _record = model;
    return new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      new MainMenu(),
      _record.last_orb,
      _record.bombs_pulled_this_level,
      _record.current_multiplier,
      _record.credits,
      _record.shuffle_enabled,
      _record.dev_mode,
      _record.testing_config,
      _record.testing_mode,
      _record.testing_stats,
      _record.log_entries,
      _record.log_sequence,
      _record.pending_choice,
      _record.pending_gamble,
      _record.gamble_orbs,
      _record.gamble_current_index,
      _record.in_gamble_choice,
      _record.point_orbs_pulled_this_level
    );
  } else if (msg instanceof AddTestOrb) {
    let orb = msg[0];
    return handle_add_test_orb(model, orb);
  } else if (msg instanceof RemoveTestOrb) {
    let index3 = msg[0];
    return handle_remove_test_orb(model, index3);
  } else if (msg instanceof SetTestMilestone) {
    let milestone = msg[0];
    return handle_set_test_milestone(model, milestone);
  } else if (msg instanceof SetTestHealth) {
    let health = msg[0];
    return handle_set_test_health(model, health);
  } else if (msg instanceof SetSimulationCount) {
    let count2 = msg[0];
    return handle_set_simulation_count(model, count2);
  } else if (msg instanceof StartSimulations) {
    return handle_start_simulations(model);
  } else if (msg instanceof ViewTestResults) {
    return handle_view_test_results(model);
  } else {
    return handle_reset_test_config(model);
  }
}
function main() {
  let _block;
  let _pipe = simple(init, update2, view);
  _block = start3(_pipe, "#app", void 0);
  let $ = _block;
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH,
      "newmoon",
      22,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $, start: 768, end: 858, pattern_start: 779, pattern_end: 784 }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
