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
  byteAt(index4) {
    if (index4 < 0 || index4 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index4);
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
function bitArrayByteAt(buffer, bitOffset, index4) {
  if (bitOffset === 0) {
    return buffer[index4] ?? 0;
  } else {
    const a = buffer[index4] << bitOffset & 255;
    const b = buffer[index4 + 1] >> 8 - bitOffset;
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
  constructor(value2) {
    super();
    this[0] = value2;
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
function cloneAndSet(arr, at2, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at2] = val;
  return out;
}
function spliceIn(arr, at2, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at2) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at2) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at2) {
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

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function min(a, b) {
  let $ = a < b;
  if ($) {
    return a;
  } else {
    return b;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function length_loop(loop$list, loop$count) {
  while (true) {
    let list4 = loop$list;
    let count = loop$count;
    if (list4 instanceof Empty) {
      return count;
    } else {
      let list$1 = list4.tail;
      loop$list = list$1;
      loop$count = count + 1;
    }
  }
}
function length(list4) {
  return length_loop(list4, 0);
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
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let _block;
      let $ = fun(first$1);
      if ($) {
        _block = prepend(first$1, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list4, predicate) {
  return filter_loop(list4, predicate, toList([]));
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
    let index4 = loop$index;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let acc$1 = prepend(fun(first$1, index4), acc);
      loop$list = rest$1;
      loop$fun = fun;
      loop$index = index4 + 1;
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
    let first = loop$first;
    let second = loop$second;
    if (first instanceof Empty) {
      return second;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first, second) {
  return append_loop(reverse(first), second);
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
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index4 = loop$index;
    if (over instanceof Empty) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index4);
      loop$with = with$;
      loop$index = index4 + 1;
    }
  }
}
function index_fold(list4, initial, fun) {
  return index_fold_loop(list4, initial, fun, 0);
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
function any(loop$list, loop$predicate) {
  while (true) {
    let list4 = loop$list;
    let predicate = loop$predicate;
    if (list4 instanceof Empty) {
      return false;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = predicate(first$1);
      if ($) {
        return true;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
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

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
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

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
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
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure2 = loop$failure;
    let decoders = loop$decoders;
    if (decoders instanceof Empty) {
      return failure2;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure2;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function run_dynamic_function(data, name, f) {
  let $ = f(data);
  if ($ instanceof Ok) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError(name, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_int(data) {
  return run_dynamic_function(data, "Int", int);
}
var int2 = /* @__PURE__ */ new Decoder(decode_int);
function decode_string(data) {
  return run_dynamic_function(data, "String", string);
}
var string2 = /* @__PURE__ */ new Decoder(decode_string);
function push_path(layer, path) {
  let decoder = one_of(
    string2,
    toList([
      (() => {
        let _pipe = int2;
        return map2(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map(
    path,
    (key) => {
      let key$1 = identity(key);
      let $ = run(key$1, decoder);
      if ($ instanceof Ok) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError(
        _record.expected,
        _record.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path instanceof Empty) {
      let _pipe = inner(data);
      return push_path(_pipe, reverse(position));
    } else {
      let key = path.head;
      let path$1 = path.tail;
      let $ = index2(data, key);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof Some) {
          let data$1 = $1[0];
          loop$path = path$1;
          loop$position = prepend(key, position);
          loop$inner = inner;
          loop$data = data$1;
          loop$handle_miss = handle_miss;
        } else {
          return handle_miss(data, prepend(key, position));
        }
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder(
    (data) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError("Field", "Nothing", toList([]))])
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value2) {
  if (/^[-+]?(\d+)$/.test(value2)) {
    return new Ok(parseInt(value2));
  } else {
    return new Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
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
function new_map() {
  return Dict.new();
}
function map_get(map4, key) {
  const value2 = map4.get(key, NOT_FOUND);
  if (value2 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value2);
}
function map_insert(key, value2, map4) {
  return map4.set(key, value2);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Array`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Nil";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function index2(data, key) {
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token2 = {};
    const entry = data.get(key, token2);
    if (entry === token2) return new Ok(new None());
    return new Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key);
  if (key_is_int && key >= 0 && key < 8 && data instanceof List) {
    let i = 0;
    for (const value2 of data) {
      if (i === key) return new Ok(new Some(value2));
      i++;
    }
    return new Error("Indexable");
  }
  if (key_is_int && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key in data) return new Ok(new Some(data[key]));
    return new Ok(new None());
  }
  return new Error(key_is_int ? "Indexable" : "Dict");
}
function int(data) {
  if (Number.isInteger(data)) return new Ok(data);
  return new Error(0);
}
function string(data) {
  if (typeof data === "string") return new Ok(data);
  return new Error("");
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key, value2) {
  return map_insert(key, value2, dict2);
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

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function identity3(x) {
  return x;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
function bool(input2) {
  return identity3(input2);
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
  constructor(kind, name, value2) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value2;
  }
};
var Property = class extends CustomType {
  constructor(kind, name, value2) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value2;
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
                  let value2 = class1 + " " + class2;
                  let attribute$1 = new Attribute(kind, "class", value2);
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
                  let value2 = style1 + ";" + style2;
                  let attribute$1 = new Attribute(kind, "style", value2);
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
function attribute(name, value2) {
  return new Attribute(attribute_kind, name, value2);
}
var property_kind = 1;
function property(name, value2) {
  return new Property(property_kind, name, value2);
}
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
function attribute2(name, value2) {
  return attribute(name, value2);
}
function property2(name, value2) {
  return property(name, value2);
}
function boolean_attribute(name, value2) {
  if (value2) {
    return attribute2(name, "");
  } else {
    return property2(name, bool(false));
  }
}
function class$(name) {
  return attribute2("class", name);
}
function id(value2) {
  return attribute2("id", value2);
}
function disabled(is_disabled) {
  return boolean_attribute("disabled", is_disabled);
}
function for$(id2) {
  return attribute2("for", id2);
}
function min2(value2) {
  return attribute2("min", value2);
}
function placeholder(text4) {
  return attribute2("placeholder", text4);
}
function type_(control_type) {
  return attribute2("type", control_type);
}
function value(control_value) {
  return attribute2("value", control_value);
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
  const value2 = map4?.get(key);
  if (value2 != null) {
    return new Ok(value2);
  } else {
    return new Error(void 0);
  }
}
function insert3(map4, key, value2) {
  map4 ??= /* @__PURE__ */ new Map();
  map4.set(key, value2);
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
  constructor(index4, parent) {
    super();
    this.index = index4;
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
function add2(parent, index4, key) {
  if (key === "") {
    return new Index(index4, parent);
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
      let index4 = path.index;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(
        separator_index,
        prepend(to_string(index4), acc)
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
    let index4 = loop$index;
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
          let child_key = key + "::" + to_string(index4);
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
          let index$1 = index4 + 1;
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
            let index$1 = index4 + 1;
            loop$key = key;
            loop$children = children$1;
            loop$index = index$1;
            loop$new_children = new_children$1;
            loop$keyed_children = keyed_children$1;
          } else {
            let node$2 = $;
            let children$1 = children.tail;
            let new_children$1 = prepend(node$2, new_children);
            let index$1 = index4 + 1;
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
          let index$1 = index4 + 1;
          loop$key = key;
          loop$children = children$1;
          loop$index = index$1;
          loop$new_children = new_children$1;
          loop$keyed_children = keyed_children$1;
        } else {
          let node$1 = $;
          let children$1 = children.tail;
          let new_children$1 = prepend(node$1, new_children);
          let index$1 = index4 + 1;
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
  constructor(index4, removed, changes, children) {
    super();
    this.index = index4;
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
  constructor(kind, key, before, count) {
    super();
    this.kind = kind;
    this.key = key;
    this.before = before;
    this.count = count;
  }
};
var RemoveKey = class extends CustomType {
  constructor(kind, key, count) {
    super();
    this.kind = kind;
    this.key = key;
    this.count = count;
  }
};
var Replace = class extends CustomType {
  constructor(kind, from, count, with$) {
    super();
    this.kind = kind;
    this.from = from;
    this.count = count;
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
  constructor(kind, from, count) {
    super();
    this.kind = kind;
    this.from = from;
    this.count = count;
  }
};
function new$4(index4, removed, changes, children) {
  return new Patch(index4, removed, changes, children);
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
function move(key, before, count) {
  return new Move(move_kind, key, before, count);
}
var remove_key_kind = 4;
function remove_key(key, count) {
  return new RemoveKey(remove_key_kind, key, count);
}
var replace_kind = 5;
function replace2(from, count, with$) {
  return new Replace(replace_kind, from, count, with$);
}
var insert_kind = 6;
function insert4(children, before) {
  return new Insert(insert_kind, children, before);
}
var remove_kind = 7;
function remove2(from, count) {
  return new Remove(remove_kind, from, count);
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
              let count = advance(next);
              let before = node_index - moved_offset;
              let move2 = move(next.key, before, count);
              let changes$1 = prepend(move2, changes);
              let moved$1 = insert2(moved, next.key);
              let moved_offset$1 = moved_offset + count;
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
            let count = advance(prev);
            let moved_offset$1 = moved_offset - count;
            let events$1 = remove_child(events, path, node_index, prev);
            let remove3 = remove_key(prev.key, count);
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
          let count = advance(next);
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
          loop$moved_offset = moved_offset + count;
          loop$removed = removed;
          loop$node_index = node_index + count;
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
              let child_path = add2(path, node_index, next$1.key);
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
            let child_path = add2(path, node_index, next$1.key);
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
        const index4 = child.index | 0;
        const next = lastChild && lastIndex - index4 === 1 ? lastChild.previousSibling : childAt(node, index4);
        self.#stack.push({ node: next, patch: child });
        lastChild = next;
        lastIndex = index4;
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
  #move(node, key, before, count) {
    let el = getKeyedChild(node, key);
    const beforeEl = childAt(node, before);
    for (let i = 0; i < count && el !== null; ++i) {
      const next = el.nextSibling;
      if (SUPPORTS_MOVE_BEFORE) {
        node.moveBefore(el, beforeEl);
      } else {
        insertBefore(node, el, beforeEl);
      }
      el = next;
    }
  }
  #removeKey(node, key, count) {
    this.#removeFromChild(node, getKeyedChild(node, key), count);
  }
  #remove(node, from, count) {
    this.#removeFromChild(node, childAt(node, from), count);
  }
  #removeFromChild(parent, child, count) {
    while (count-- > 0 && child !== null) {
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
  #replace(parent, from, count, child) {
    this.#remove(parent, from, count);
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
      value: value2,
      prevent_default: prevent,
      stop_propagation: stop,
      immediate: immediate2,
      include,
      debounce: debounceDelay,
      throttle: throttleDelay
    } = attribute3;
    switch (kind) {
      case attribute_kind: {
        const valueOrDefault = value2 ?? "";
        if (name === "virtual:defaultValue") {
          node.defaultValue = valueOrDefault;
          return;
        }
        if (valueOrDefault !== node.getAttribute(name)) {
          node.setAttribute(name, valueOrDefault);
        }
        SYNCED_ATTRIBUTES[name]?.added?.(node, value2);
        break;
      }
      case property_kind:
        node[name] = value2;
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
              let index4 = [].indexOf.call(siblings, pathNode);
              if (parent === this.#root) {
                index4 -= this.offset;
              }
              path = `${separator_index}${index4}${path}`;
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
var childAt = (node, at2) => node.childNodes[at2 | 0];
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
    for (let i = 0, input2 = event4, output = data; i < path.length; i++) {
      if (i === path.length - 1) {
        output[path[i]] = input2[path[i]];
        break;
      }
      output = output[path[i]] ??= {};
      input2 = input2[path[i]];
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
    added(node, value2) {
      node[name] = value2;
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
  const value2 = node.value;
  const checked = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked) return;
  if (tag === "input" && node.type === "radio" && !checked) return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value2) return;
  queueMicrotask(() => {
    node.value = value2;
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
  let index4 = node.attributes.length;
  let attributes = empty_list;
  while (index4-- > 0) {
    attributes = new NonEmpty(
      virtualiseAttribute(node.attributes[index4]),
      attributes
    );
  }
  return attributes;
};
var virtualiseAttribute = (attr) => {
  const name = attr.localName;
  const value2 = attr.value;
  return attribute2(name, value2);
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
    let path = add2(parent, child_index, child.key);
    let _pipe = handlers;
    let _pipe$1 = remove_attributes(_pipe, path, attributes);
    return do_remove_children(_pipe$1, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
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
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let _pipe = handlers;
    let _pipe$1 = add_attributes(_pipe, composed_mapper, path, attributes);
    return do_add_children(_pipe$1, composed_mapper, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return add_attributes(handlers, composed_mapper, path, attributes);
  }
}
function add_child(events, mapper, parent, index4, child) {
  let handlers = do_add_child(events.handlers, mapper, parent, index4, child);
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
    let count = loop$count;
    if (children instanceof Empty) {
      return count;
    } else {
      let $ = children.head;
      if ($ instanceof Fragment) {
        let rest = children.tail;
        let children_count = $.children_count;
        loop$children = rest;
        loop$count = count + children_count;
      } else {
        let rest = children.tail;
        loop$children = rest;
        loop$count = count + 1;
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
function input(attrs) {
  return element2("input", attrs, empty_list);
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
var Permanent = class extends CustomType {
};
var Countdown = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Triggered = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var PointMultiplier = class extends CustomType {
  constructor(multiplier, duration) {
    super();
    this.multiplier = multiplier;
    this.duration = duration;
  }
};
var BombImmunity = class extends CustomType {
  constructor(duration) {
    super();
    this.duration = duration;
  }
};
var ClearOnLevel = class extends CustomType {
};
var ClearOnGame = class extends CustomType {
};
var RiskEffects = class extends CustomType {
  constructor(health_gained, points_gained, damage_taken, special_orbs) {
    super();
    this.health_gained = health_gained;
    this.points_gained = points_gained;
    this.damage_taken = damage_taken;
    this.special_orbs = special_orbs;
  }
};
var PointOrb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var BombOrb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var HealthOrb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var AllCollectorOrb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var PointCollectorOrb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var BombSurvivorOrb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var MultiplierOrb = class extends CustomType {
};
var BombImmunityOrb = class extends CustomType {
};
var ChoiceOrb = class extends CustomType {
};
var RiskOrb = class extends CustomType {
};
var PointRecoveryOrb = class extends CustomType {
};
var Main = class extends CustomType {
};
var OrbSelection = class extends CustomType {
};
var ValueConfiguration = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Gameplay = class extends CustomType {
};
var Success = class extends CustomType {
};
var Failure = class extends CustomType {
};
var TestingChoosing = class extends CustomType {
};
var TestingRiskAccept = class extends CustomType {
};
var TestingRiskReveal = class extends CustomType {
};
var TestingRiskPlaying = class extends CustomType {
};
var TestingRiskSurvived = class extends CustomType {
};
var TestingRiskConsumed = class extends CustomType {
};
var TestingRiskDied = class extends CustomType {
};
var Playing = class extends CustomType {
};
var Victory = class extends CustomType {
};
var Defeat = class extends CustomType {
};
var GameComplete = class extends CustomType {
};
var Choosing = class extends CustomType {
};
var RiskAccept = class extends CustomType {
};
var RiskReveal = class extends CustomType {
};
var RiskPlaying = class extends CustomType {
};
var RiskSurvived = class extends CustomType {
};
var RiskConsumed = class extends CustomType {
};
var RiskDied = class extends CustomType {
};
var Menu = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Testing = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Game = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DataSample = class extends CustomType {
};
var HazardSample = class extends CustomType {
};
var HealthSample = class extends CustomType {
};
var MultiplierSample = class extends CustomType {
};
var AllCollectorSample = class extends CustomType {
};
var PointCollectorSample = class extends CustomType {
};
var BombSurvivorSample = class extends CustomType {
};
var BombImmunitySample = class extends CustomType {
};
var ChoiceSample = class extends CustomType {
};
var RiskSample = class extends CustomType {
};
var PointRecoverySample = class extends CustomType {
};
var Model = class extends CustomType {
  constructor(health, points, level, milestone, bag, screen, last_orb, last_orb_message, input_value, pulled_orbs, point_multiplier, bomb_immunity, active_statuses, choice_orb_1, choice_orb_2, dev_mode, risk_orbs, risk_original_orbs, risk_pulled_orbs, risk_accumulated_effects, risk_health) {
    super();
    this.health = health;
    this.points = points;
    this.level = level;
    this.milestone = milestone;
    this.bag = bag;
    this.screen = screen;
    this.last_orb = last_orb;
    this.last_orb_message = last_orb_message;
    this.input_value = input_value;
    this.pulled_orbs = pulled_orbs;
    this.point_multiplier = point_multiplier;
    this.bomb_immunity = bomb_immunity;
    this.active_statuses = active_statuses;
    this.choice_orb_1 = choice_orb_1;
    this.choice_orb_2 = choice_orb_2;
    this.dev_mode = dev_mode;
    this.risk_orbs = risk_orbs;
    this.risk_original_orbs = risk_original_orbs;
    this.risk_pulled_orbs = risk_pulled_orbs;
    this.risk_accumulated_effects = risk_accumulated_effects;
    this.risk_health = risk_health;
  }
};
var StartGame = class extends CustomType {
};
var GoToOrbTesting = class extends CustomType {
};
var SelectOrbType = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UpdateInputValue = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ConfirmOrbValue = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var BackToMainMenu = class extends CustomType {
};
var BackToOrbTesting = class extends CustomType {
};
var StartTestingWithBothStatuses = class extends CustomType {
};
var StartTestingWithTripleChoice = class extends CustomType {
};
var StartTestingRiskSuccess = class extends CustomType {
};
var StartTestingRiskFailure = class extends CustomType {
};
var StartTestingRiskContinue = class extends CustomType {
};
var StartTestingPointRecoveryFirst = class extends CustomType {
};
var StartTestingPointRecoveryActive = class extends CustomType {
};
var PullOrb = class extends CustomType {
};
var NextLevel = class extends CustomType {
};
var RestartGame = class extends CustomType {
};
var ResetTesting = class extends CustomType {
};
var ExitTesting = class extends CustomType {
};
var ChooseOrb = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ToggleDevMode = class extends CustomType {
};
var AcceptRisk = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var AcceptFate = class extends CustomType {
};
var PullRiskOrb = class extends CustomType {
};
var ApplyRiskEffects = class extends CustomType {
};
var ContinueAfterRiskConsumption = class extends CustomType {
};

// build/dev/javascript/newmoon/display.mjs
function orb_display_name(orb) {
  if (orb instanceof PointOrb) {
    return "Data Sample";
  } else if (orb instanceof BombOrb) {
    return "Hazard Sample";
  } else if (orb instanceof HealthOrb) {
    return "Health Sample";
  } else if (orb instanceof AllCollectorOrb) {
    return "All Collector Sample";
  } else if (orb instanceof PointCollectorOrb) {
    return "Point Collector Sample";
  } else if (orb instanceof BombSurvivorOrb) {
    return "Bomb Survivor Sample";
  } else if (orb instanceof MultiplierOrb) {
    return "Multiplier Sample";
  } else if (orb instanceof BombImmunityOrb) {
    return "Shield Generator Sample";
  } else if (orb instanceof ChoiceOrb) {
    return "Choice Portal Sample";
  } else if (orb instanceof RiskOrb) {
    return "Fate Sample";
  } else {
    return "Point Recovery Sample";
  }
}
function orb_result_message(orb) {
  if (orb instanceof PointOrb) {
    let value2 = orb[0];
    return "\u25CF DATA ACQUIRED +" + to_string(value2);
  } else if (orb instanceof BombOrb) {
    let value2 = orb[0];
    return "\u25CB SYSTEM DAMAGE -" + to_string(value2);
  } else if (orb instanceof HealthOrb) {
    let value2 = orb[0];
    return "\u25C7 SYSTEMS RESTORED +" + to_string(value2);
  } else if (orb instanceof AllCollectorOrb) {
    return "\u25C8 TOTAL COLLECTION +?";
  } else if (orb instanceof PointCollectorOrb) {
    return "\u25C9 DATA COLLECTION +?";
  } else if (orb instanceof BombSurvivorOrb) {
    return "\u25C6 SURVIVAL BONUS +?";
  } else if (orb instanceof MultiplierOrb) {
    return "\u25C8 MULTIPLIER ACTIVATED \xD72";
  } else if (orb instanceof BombImmunityOrb) {
    return "\u25C8 SHIELD GENERATOR ACTIVATED";
  } else if (orb instanceof ChoiceOrb) {
    return "\u25C8 CHOICE PORTAL ACTIVATED";
  } else if (orb instanceof RiskOrb) {
    return "\u26A0 FATE SAMPLE DETECTED";
  } else {
    return "\u25C7 DATA RECOVERY ACTIVATED";
  }
}
function collector_result_message(orb, bonus_points) {
  if (orb instanceof AllCollectorOrb) {
    return "\u25C8 TOTAL COLLECTION +" + to_string(bonus_points);
  } else if (orb instanceof PointCollectorOrb) {
    return "\u25C9 DATA COLLECTION +" + to_string(bonus_points);
  } else if (orb instanceof BombSurvivorOrb) {
    return "\u25C6 SURVIVAL BONUS +" + to_string(bonus_points);
  } else {
    return orb_result_message(orb);
  }
}
function data_target_message(milestone) {
  return "DATA TARGET ACHIEVED: " + to_string(milestone) + " UNITS";
}
var container_label = "SAMPLE CONTAINER";
var extract_button_text = "EXTRACT SAMPLE";
var specimens_suffix = " SPECIMENS";
var start_game_button_text = "START MISSION";
var orb_testing_button_text = "SAMPLE TESTING";
var main_menu_subtitle = "PREPARE FOR DEEP SPACE EXPLORATION";
var orb_testing_title = "SAMPLE TESTING PROTOCOL";
var orb_testing_subtitle = "SELECT A SAMPLE TYPE FOR CONTROLLED TESTING";
var back_to_menu_text = "BACK TO MENU";
var testing_mode_indicator = "TESTING MODE ACTIVE";
var reset_testing_text = "RESET TEST";
var exit_testing_text = "EXIT TO MENU";
var sector_complete_title = "SECTOR COMPLETE";
var mission_failed_title = "MISSION FAILED";
var advance_button_text = "ADVANCE TO NEXT SECTOR";
var play_again_text = "PLAY AGAIN";
var systems_label = "SYSTEMS";
var data_label = "DATA";
var target_label = "TARGET";
var sector_label = "SECTOR";
var mission_failed_message = "ALL SYSTEMS COMPROMISED. INITIATING RESET PROTOCOL.";

// build/dev/javascript/newmoon/status.mjs
var Replace2 = class extends CustomType {
};
var Add = class extends CustomType {
};
function create_point_multiplier(multiplier) {
  return new PointMultiplier(multiplier, new Permanent());
}
function create_bomb_immunity(turns) {
  return new BombImmunity(new Countdown(turns));
}
function get_point_multiplier(statuses) {
  let $ = find2(
    statuses,
    (status) => {
      if (status instanceof PointMultiplier) {
        return true;
      } else {
        return false;
      }
    }
  );
  if ($ instanceof Ok) {
    let $1 = $[0];
    if ($1 instanceof PointMultiplier) {
      let multiplier = $1.multiplier;
      return multiplier;
    } else {
      return 1;
    }
  } else {
    return 1;
  }
}
function has_bomb_immunity(statuses) {
  return any(
    statuses,
    (status) => {
      if (status instanceof BombImmunity) {
        return true;
      } else {
        return false;
      }
    }
  );
}
function is_same_status_type(status1, status2) {
  if (status2 instanceof PointMultiplier) {
    if (status1 instanceof PointMultiplier) {
      return true;
    } else {
      return false;
    }
  } else if (status1 instanceof BombImmunity) {
    return true;
  } else {
    return false;
  }
}
function find_existing_status(statuses, new_status) {
  return index_fold(
    statuses,
    new Error(void 0),
    (acc, status, index4) => {
      if (acc instanceof Ok) {
        return acc;
      } else {
        let $ = is_same_status_type(status, new_status);
        if ($) {
          return new Ok(index4);
        } else {
          return new Error(void 0);
        }
      }
    }
  );
}
function get_status_stacking_behavior(status) {
  if (status instanceof PointMultiplier) {
    return new Replace2();
  } else {
    return new Add();
  }
}
function get_status_persistence(status) {
  if (status instanceof PointMultiplier) {
    return new ClearOnLevel();
  } else {
    return new ClearOnLevel();
  }
}
function clear_statuses_by_persistence(model, persistence) {
  let remaining_statuses = filter(
    model.active_statuses,
    (status) => {
      return !isEqual(get_status_persistence(status), persistence);
    }
  );
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    _record.screen,
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    remaining_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function decrement_duration(duration) {
  if (duration instanceof Permanent) {
    return new Permanent();
  } else if (duration instanceof Countdown) {
    let n = duration[0];
    if (n > 0) {
      return new Countdown(n - 1);
    } else {
      return new Countdown(0);
    }
  } else {
    let n = duration[0];
    return new Triggered(n);
  }
}
function decrement_status_duration(status) {
  if (status instanceof PointMultiplier) {
    let multiplier = status.multiplier;
    let duration = status.duration;
    return new PointMultiplier(multiplier, decrement_duration(duration));
  } else {
    let duration = status.duration;
    return new BombImmunity(decrement_duration(duration));
  }
}
function is_status_active(status) {
  if (status instanceof PointMultiplier) {
    let $ = status.duration;
    if ($ instanceof Permanent) {
      return true;
    } else if ($ instanceof Countdown) {
      let n = $[0];
      return n > 0;
    } else {
      return true;
    }
  } else {
    let $ = status.duration;
    if ($ instanceof Countdown) {
      let n = $[0];
      return n > 0;
    } else {
      return true;
    }
  }
}
function tick_statuses(model) {
  let _block;
  let _pipe = model.active_statuses;
  let _pipe$1 = map(_pipe, decrement_status_duration);
  _block = filter(_pipe$1, is_status_active);
  let updated_statuses = _block;
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    _record.screen,
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    updated_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function status_to_display_text(status) {
  if (status instanceof PointMultiplier) {
    let multiplier = status.multiplier;
    return "\u25C8 SIGNAL AMPLIFIER \xD7" + to_string(multiplier);
  } else {
    let $ = status.duration;
    if ($ instanceof Permanent) {
      return "\u25C8 HAZARD SHIELD PERMANENT";
    } else if ($ instanceof Countdown) {
      let remaining = $[0];
      return "\u25C8 HAZARD SHIELD ACTIVE (" + to_string(remaining) + " remaining)";
    } else {
      return "";
    }
  }
}
function at_helper(loop$list, loop$index) {
  while (true) {
    let list4 = loop$list;
    let index4 = loop$index;
    if (list4 instanceof Empty) {
      return new Error(void 0);
    } else if (index4 === 0) {
      let first = list4.head;
      return new Ok(first);
    } else {
      let n = index4;
      let rest = list4.tail;
      loop$list = rest;
      loop$index = n - 1;
    }
  }
}
function at(list4, index4) {
  let $ = index4 >= 0;
  if ($) {
    return at_helper(list4, index4);
  } else {
    return new Error(void 0);
  }
}
function replace_at_helper(list4, target_index, new_item, current_index) {
  if (list4 instanceof Empty) {
    return toList([]);
  } else if (current_index === target_index) {
    let rest = list4.tail;
    return prepend(new_item, rest);
  } else {
    let first = list4.head;
    let rest = list4.tail;
    return prepend(
      first,
      replace_at_helper(rest, target_index, new_item, current_index + 1)
    );
  }
}
function replace_at(list4, index4, new_item) {
  let $ = index4 >= 0;
  if ($) {
    return replace_at_helper(list4, index4, new_item, 0);
  } else {
    return list4;
  }
}
function combine_statuses(statuses, index4, new_status) {
  let $ = at(statuses, index4);
  if ($ instanceof Ok) {
    let existing_status = $[0];
    let _block;
    if (new_status instanceof BombImmunity) {
      let $1 = new_status.duration;
      if ($1 instanceof Countdown) {
        if (existing_status instanceof BombImmunity) {
          let $2 = existing_status.duration;
          if ($2 instanceof Countdown) {
            let new$8 = $1[0];
            let existing = $2[0];
            _block = new BombImmunity(new Countdown(existing + new$8));
          } else {
            _block = new_status;
          }
        } else {
          _block = new_status;
        }
      } else {
        _block = new_status;
      }
    } else {
      _block = new_status;
    }
    let combined = _block;
    return replace_at(statuses, index4, combined);
  } else {
    return statuses;
  }
}
function add_status(model, new_status) {
  let _block;
  let $ = find_existing_status(model.active_statuses, new_status);
  if ($ instanceof Ok) {
    let existing_index = $[0];
    let $1 = get_status_stacking_behavior(new_status);
    if ($1 instanceof Replace2) {
      _block = replace_at(model.active_statuses, existing_index, new_status);
    } else {
      _block = combine_statuses(
        model.active_statuses,
        existing_index,
        new_status
      );
    }
  } else {
    _block = prepend(new_status, model.active_statuses);
  }
  let updated_statuses = _block;
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    _record.screen,
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    updated_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}

// build/dev/javascript/newmoon/update.mjs
function starter_orbs() {
  return toList([
    new PointOrb(1),
    new PointOrb(1),
    new PointOrb(1),
    new PointOrb(1),
    new PointOrb(2),
    new PointOrb(2),
    new PointOrb(2),
    new PointOrb(2),
    new PointOrb(3),
    new PointOrb(3),
    new PointOrb(3),
    new PointOrb(4),
    new PointOrb(4),
    new PointOrb(5),
    new PointOrb(5),
    new PointOrb(6),
    new PointOrb(6),
    new PointOrb(7),
    new PointOrb(8),
    new PointOrb(10)
  ]);
}
function init(_) {
  return new Model(
    5,
    0,
    1,
    12,
    starter_orbs(),
    new Menu(new Main()),
    new None(),
    new None(),
    "",
    toList([]),
    1,
    0,
    toList([]),
    new None(),
    new None(),
    false,
    toList([]),
    toList([]),
    toList([]),
    new RiskEffects(0, 0, 0, toList([])),
    5
  );
}
function create_test_bag(test_orb) {
  let _pipe = toList([test_orb]);
  return append(_pipe, starter_orbs());
}
function count_point_orbs(orbs) {
  return fold(
    orbs,
    0,
    (count, orb) => {
      if (orb instanceof PointOrb) {
        return count + 1;
      } else {
        return count;
      }
    }
  );
}
function count_pulled_bomb_orbs(pulled_orbs) {
  return fold(
    pulled_orbs,
    0,
    (count, orb) => {
      if (orb instanceof BombOrb) {
        return count + 1;
      } else {
        return count;
      }
    }
  );
}
function get_milestone_for_level(level) {
  if (level === 1) {
    return 12;
  } else if (level === 2) {
    return 18;
  } else if (level === 3) {
    return 28;
  } else if (level === 4) {
    return 44;
  } else if (level === 5) {
    return 66;
  } else {
    return 12;
  }
}
function find_lowest_point_orb(pulled_orbs) {
  let point_orbs = filter(
    pulled_orbs,
    (orb) => {
      if (orb instanceof PointOrb) {
        return true;
      } else {
        return false;
      }
    }
  );
  if (point_orbs instanceof Empty) {
    return new None();
  } else {
    let first = point_orbs.head;
    let rest = point_orbs.tail;
    let lowest = fold(
      rest,
      first,
      (current_lowest, orb) => {
        if (orb instanceof PointOrb) {
          if (current_lowest instanceof PointOrb) {
            let new_value = orb[0];
            let current_value = current_lowest[0];
            let $ = new_value < current_value;
            if ($) {
              return orb;
            } else {
              return current_lowest;
            }
          } else {
            return current_lowest;
          }
        } else {
          return current_lowest;
        }
      }
    );
    return new Some(lowest);
  }
}
function handle_start_game(model) {
  let clean_model = clear_statuses_by_persistence(
    model,
    new ClearOnGame()
  );
  let _record = clean_model;
  return new Model(
    5,
    0,
    _record.level,
    _record.milestone,
    starter_orbs(),
    new Game(new Playing()),
    new None(),
    new None(),
    _record.input_value,
    toList([]),
    1,
    0,
    _record.active_statuses,
    new None(),
    new None(),
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_go_to_orb_testing(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    new Testing(new OrbSelection()),
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_select_orb_type(model, orb_type) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    new Testing(new ValueConfiguration(orb_type)),
    _record.last_orb,
    _record.last_orb_message,
    "1",
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_update_input_value(model, value2) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    _record.screen,
    _record.last_orb,
    _record.last_orb_message,
    value2,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_confirm_orb_value(model, orb_type) {
  let $ = parse_int(model.input_value);
  if ($ instanceof Ok) {
    let value2 = $[0];
    if (value2 > 0) {
      let _block;
      if (orb_type instanceof DataSample) {
        _block = new PointOrb(value2);
      } else if (orb_type instanceof HazardSample) {
        _block = new BombOrb(value2);
      } else if (orb_type instanceof HealthSample) {
        _block = new HealthOrb(value2);
      } else if (orb_type instanceof MultiplierSample) {
        _block = new MultiplierOrb();
      } else if (orb_type instanceof AllCollectorSample) {
        _block = new AllCollectorOrb(value2);
      } else if (orb_type instanceof PointCollectorSample) {
        _block = new PointCollectorOrb(value2);
      } else if (orb_type instanceof BombSurvivorSample) {
        _block = new BombSurvivorOrb(value2);
      } else if (orb_type instanceof BombImmunitySample) {
        _block = new BombImmunityOrb();
      } else if (orb_type instanceof ChoiceSample) {
        _block = new ChoiceOrb();
      } else if (orb_type instanceof RiskSample) {
        _block = new RiskOrb();
      } else {
        _block = new PointRecoveryOrb();
      }
      let test_orb = _block;
      let clean_model = clear_statuses_by_persistence(
        model,
        new ClearOnGame()
      );
      let _record = clean_model;
      return new Model(
        5,
        0,
        _record.level,
        _record.milestone,
        create_test_bag(test_orb),
        new Testing(new Gameplay()),
        new None(),
        new None(),
        _record.input_value,
        toList([]),
        1,
        0,
        _record.active_statuses,
        new None(),
        new None(),
        _record.dev_mode,
        _record.risk_orbs,
        _record.risk_original_orbs,
        _record.risk_pulled_orbs,
        _record.risk_accumulated_effects,
        _record.risk_health
      );
    } else {
      return model;
    }
  } else {
    return model;
  }
}
function handle_back_to_orb_testing(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    new Testing(new OrbSelection()),
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_start_testing_with_both_statuses(model) {
  let _block;
  let _pipe = toList([new MultiplierOrb(), new BombImmunityOrb()]);
  _block = append(_pipe, starter_orbs());
  let test_bag = _block;
  let clean_model = clear_statuses_by_persistence(
    model,
    new ClearOnGame()
  );
  let _record = clean_model;
  return new Model(
    5,
    0,
    _record.level,
    _record.milestone,
    test_bag,
    new Testing(new Gameplay()),
    new None(),
    new None(),
    _record.input_value,
    toList([]),
    1,
    0,
    _record.active_statuses,
    new None(),
    new None(),
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_start_testing_with_triple_choice(model) {
  let _block;
  let _pipe = toList([new ChoiceOrb(), new ChoiceOrb(), new ChoiceOrb()]);
  _block = append(_pipe, starter_orbs());
  let test_bag = _block;
  let clean_model = clear_statuses_by_persistence(
    model,
    new ClearOnGame()
  );
  let _record = clean_model;
  return new Model(
    5,
    0,
    _record.level,
    _record.milestone,
    test_bag,
    new Testing(new Gameplay()),
    new None(),
    new None(),
    _record.input_value,
    toList([]),
    1,
    0,
    _record.active_statuses,
    new None(),
    new None(),
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_back_to_main_menu(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    new Menu(new Main()),
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_start_testing_risk_success(model) {
  let risk_orbs = toList([
    new PointOrb(3),
    new BombOrb(1),
    new PointOrb(2),
    new HealthOrb(2),
    new PointOrb(1)
  ]);
  let _block;
  let _pipe = toList([new RiskOrb()]);
  let _pipe$1 = append(_pipe, risk_orbs);
  _block = append(_pipe$1, starter_orbs());
  let test_bag = _block;
  let clean_model = clear_statuses_by_persistence(
    model,
    new ClearOnGame()
  );
  let _record = clean_model;
  return new Model(
    5,
    0,
    _record.level,
    _record.milestone,
    test_bag,
    new Testing(new Gameplay()),
    new None(),
    new None(),
    _record.input_value,
    toList([]),
    1,
    0,
    _record.active_statuses,
    new None(),
    new None(),
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_start_testing_risk_failure(model) {
  let risk_orbs = toList([
    new BombOrb(2),
    new BombOrb(2),
    new BombOrb(2),
    new BombOrb(1)
  ]);
  let _block;
  let _pipe = toList([new RiskOrb()]);
  let _pipe$1 = append(_pipe, risk_orbs);
  _block = append(_pipe$1, starter_orbs());
  let test_bag = _block;
  let clean_model = clear_statuses_by_persistence(
    model,
    new ClearOnGame()
  );
  let _record = clean_model;
  return new Model(
    5,
    0,
    _record.level,
    _record.milestone,
    test_bag,
    new Testing(new Gameplay()),
    new None(),
    new None(),
    _record.input_value,
    toList([]),
    1,
    0,
    _record.active_statuses,
    new None(),
    new None(),
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_start_testing_risk_continue(model) {
  let risk_orbs = toList([
    new PointOrb(1),
    new PointOrb(1),
    new PointOrb(1),
    new PointOrb(1),
    new PointOrb(1)
  ]);
  let _block;
  let _pipe = toList([new RiskOrb()]);
  let _pipe$1 = append(_pipe, risk_orbs);
  _block = append(_pipe$1, starter_orbs());
  let test_bag = _block;
  let clean_model = clear_statuses_by_persistence(
    model,
    new ClearOnGame()
  );
  let _record = clean_model;
  return new Model(
    5,
    0,
    _record.level,
    50,
    test_bag,
    new Testing(new Gameplay()),
    new None(),
    new None(),
    _record.input_value,
    toList([]),
    1,
    0,
    _record.active_statuses,
    new None(),
    new None(),
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_start_testing_point_recovery_first(model) {
  let test_bag = toList([
    new PointRecoveryOrb(),
    new PointOrb(1),
    new PointOrb(2),
    new PointOrb(3)
  ]);
  let clean_model = clear_statuses_by_persistence(
    model,
    new ClearOnGame()
  );
  let _record = clean_model;
  return new Model(
    5,
    0,
    _record.level,
    _record.milestone,
    test_bag,
    new Testing(new Gameplay()),
    new None(),
    new None(),
    _record.input_value,
    toList([]),
    1,
    0,
    _record.active_statuses,
    new None(),
    new None(),
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_start_testing_point_recovery_active(model) {
  let test_bag = toList([
    new PointOrb(1),
    new PointOrb(3),
    new PointRecoveryOrb(),
    new PointOrb(2)
  ]);
  let clean_model = clear_statuses_by_persistence(
    model,
    new ClearOnGame()
  );
  let _record = clean_model;
  return new Model(
    5,
    0,
    _record.level,
    _record.milestone,
    test_bag,
    new Testing(new Gameplay()),
    new None(),
    new None(),
    _record.input_value,
    toList([]),
    1,
    0,
    _record.active_statuses,
    new None(),
    new None(),
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_restart_game(model) {
  return new Model(
    5,
    0,
    1,
    5,
    starter_orbs(),
    new Menu(new Main()),
    new None(),
    new None(),
    "",
    toList([]),
    1,
    0,
    toList([]),
    new None(),
    new None(),
    model.dev_mode,
    toList([]),
    toList([]),
    toList([]),
    new RiskEffects(0, 0, 0, toList([])),
    5
  );
}
function handle_next_level(model) {
  let clean_model = clear_statuses_by_persistence(
    model,
    new ClearOnLevel()
  );
  let new_level = model.level + 1;
  let new_milestone = get_milestone_for_level(new_level);
  let _record = clean_model;
  return new Model(
    5,
    0,
    new_level,
    new_milestone,
    starter_orbs(),
    new Game(new Playing()),
    new None(),
    new None(),
    _record.input_value,
    toList([]),
    1,
    0,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_reset_testing(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    new Testing(new OrbSelection()),
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_exit_testing(model) {
  return new Model(
    5,
    0,
    1,
    5,
    starter_orbs(),
    new Menu(new Main()),
    new None(),
    new None(),
    "",
    toList([]),
    1,
    0,
    toList([]),
    new None(),
    new None(),
    model.dev_mode,
    toList([]),
    toList([]),
    toList([]),
    new RiskEffects(0, 0, 0, toList([])),
    5
  );
}
function check_game_status(model) {
  let $ = model.screen;
  if ($ instanceof Testing) {
    let $1 = $[0];
    if ($1 instanceof Gameplay) {
      let $2 = model.health <= 0;
      let $3 = model.points >= model.milestone;
      let $4 = is_empty(model.bag);
      if ($2) {
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          _record.bag,
          new Testing(new Failure()),
          _record.last_orb,
          _record.last_orb_message,
          _record.input_value,
          _record.pulled_orbs,
          _record.point_multiplier,
          _record.bomb_immunity,
          _record.active_statuses,
          _record.choice_orb_1,
          _record.choice_orb_2,
          _record.dev_mode,
          _record.risk_orbs,
          _record.risk_original_orbs,
          _record.risk_pulled_orbs,
          _record.risk_accumulated_effects,
          _record.risk_health
        );
      } else if ($3) {
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          _record.bag,
          new Testing(new Success()),
          _record.last_orb,
          _record.last_orb_message,
          _record.input_value,
          _record.pulled_orbs,
          _record.point_multiplier,
          _record.bomb_immunity,
          _record.active_statuses,
          _record.choice_orb_1,
          _record.choice_orb_2,
          _record.dev_mode,
          _record.risk_orbs,
          _record.risk_original_orbs,
          _record.risk_pulled_orbs,
          _record.risk_accumulated_effects,
          _record.risk_health
        );
      } else if ($4) {
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          _record.bag,
          new Testing(new Failure()),
          _record.last_orb,
          _record.last_orb_message,
          _record.input_value,
          _record.pulled_orbs,
          _record.point_multiplier,
          _record.bomb_immunity,
          _record.active_statuses,
          _record.choice_orb_1,
          _record.choice_orb_2,
          _record.dev_mode,
          _record.risk_orbs,
          _record.risk_original_orbs,
          _record.risk_pulled_orbs,
          _record.risk_accumulated_effects,
          _record.risk_health
        );
      } else {
        return model;
      }
    } else {
      return model;
    }
  } else if ($ instanceof Game) {
    let $1 = $[0];
    if ($1 instanceof Playing) {
      let $2 = model.health <= 0;
      let $3 = model.points >= model.milestone;
      let $4 = is_empty(model.bag);
      if ($2) {
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          _record.bag,
          new Game(new Defeat()),
          _record.last_orb,
          _record.last_orb_message,
          _record.input_value,
          _record.pulled_orbs,
          _record.point_multiplier,
          _record.bomb_immunity,
          _record.active_statuses,
          _record.choice_orb_1,
          _record.choice_orb_2,
          _record.dev_mode,
          _record.risk_orbs,
          _record.risk_original_orbs,
          _record.risk_pulled_orbs,
          _record.risk_accumulated_effects,
          _record.risk_health
        );
      } else if ($3) {
        let $5 = model.level === 5;
        if ($5) {
          let _record = model;
          return new Model(
            _record.health,
            _record.points,
            _record.level,
            _record.milestone,
            _record.bag,
            new Game(new GameComplete()),
            _record.last_orb,
            _record.last_orb_message,
            _record.input_value,
            _record.pulled_orbs,
            _record.point_multiplier,
            _record.bomb_immunity,
            _record.active_statuses,
            _record.choice_orb_1,
            _record.choice_orb_2,
            _record.dev_mode,
            _record.risk_orbs,
            _record.risk_original_orbs,
            _record.risk_pulled_orbs,
            _record.risk_accumulated_effects,
            _record.risk_health
          );
        } else {
          let _record = model;
          return new Model(
            _record.health,
            _record.points,
            _record.level,
            _record.milestone,
            _record.bag,
            new Game(new Victory()),
            _record.last_orb,
            _record.last_orb_message,
            _record.input_value,
            _record.pulled_orbs,
            _record.point_multiplier,
            _record.bomb_immunity,
            _record.active_statuses,
            _record.choice_orb_1,
            _record.choice_orb_2,
            _record.dev_mode,
            _record.risk_orbs,
            _record.risk_original_orbs,
            _record.risk_pulled_orbs,
            _record.risk_accumulated_effects,
            _record.risk_health
          );
        }
      } else if ($4) {
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          _record.bag,
          new Game(new Defeat()),
          _record.last_orb,
          _record.last_orb_message,
          _record.input_value,
          _record.pulled_orbs,
          _record.point_multiplier,
          _record.bomb_immunity,
          _record.active_statuses,
          _record.choice_orb_1,
          _record.choice_orb_2,
          _record.dev_mode,
          _record.risk_orbs,
          _record.risk_original_orbs,
          _record.risk_pulled_orbs,
          _record.risk_accumulated_effects,
          _record.risk_health
        );
      } else {
        return model;
      }
    } else {
      return model;
    }
  } else {
    return model;
  }
}
function handle_toggle_dev_mode(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    _record.screen,
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    !model.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_risk_orb_activation(model) {
  let _block;
  let $ = model.screen;
  if ($ instanceof Testing) {
    let $1 = $[0];
    if ($1 instanceof Gameplay) {
      _block = new Testing(new TestingRiskAccept());
    } else {
      _block = model.screen;
    }
  } else if ($ instanceof Game) {
    let $1 = $[0];
    if ($1 instanceof Playing) {
      _block = new Game(new RiskAccept());
    } else {
      _block = model.screen;
    }
  } else {
    _block = model.screen;
  }
  let screen = _block;
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    screen,
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_accept_risk(loop$model, loop$accept) {
  while (true) {
    let model = loop$model;
    let accept = loop$accept;
    if (accept) {
      let $ = length(model.bag) >= 5;
      if ($) {
        let risk_orbs = take(model.bag, 5);
        let remaining_bag = drop(model.bag, 5);
        let _block;
        let $1 = model.screen;
        if ($1 instanceof Testing) {
          let $2 = $1[0];
          if ($2 instanceof TestingRiskAccept) {
            _block = new Testing(new TestingRiskReveal());
          } else {
            _block = model.screen;
          }
        } else if ($1 instanceof Game) {
          let $2 = $1[0];
          if ($2 instanceof RiskAccept) {
            _block = new Game(new RiskReveal());
          } else {
            _block = model.screen;
          }
        } else {
          _block = model.screen;
        }
        let screen = _block;
        let _record = model;
        return new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          remaining_bag,
          screen,
          _record.last_orb,
          _record.last_orb_message,
          _record.input_value,
          _record.pulled_orbs,
          _record.point_multiplier,
          _record.bomb_immunity,
          _record.active_statuses,
          _record.choice_orb_1,
          _record.choice_orb_2,
          _record.dev_mode,
          risk_orbs,
          risk_orbs,
          toList([]),
          new RiskEffects(0, 0, 0, toList([])),
          model.health
        );
      } else {
        loop$model = model;
        loop$accept = false;
      }
    } else {
      let $ = model.screen;
      if ($ instanceof Testing) {
        let $1 = $[0];
        if ($1 instanceof TestingRiskAccept) {
          return check_game_status(
            (() => {
              let _record = model;
              return new Model(
                _record.health,
                _record.points,
                _record.level,
                _record.milestone,
                _record.bag,
                new Testing(new Gameplay()),
                _record.last_orb,
                _record.last_orb_message,
                _record.input_value,
                _record.pulled_orbs,
                _record.point_multiplier,
                _record.bomb_immunity,
                _record.active_statuses,
                _record.choice_orb_1,
                _record.choice_orb_2,
                _record.dev_mode,
                _record.risk_orbs,
                _record.risk_original_orbs,
                _record.risk_pulled_orbs,
                _record.risk_accumulated_effects,
                _record.risk_health
              );
            })()
          );
        } else {
          return model;
        }
      } else if ($ instanceof Game) {
        let $1 = $[0];
        if ($1 instanceof RiskAccept) {
          return check_game_status(
            (() => {
              let _record = model;
              return new Model(
                _record.health,
                _record.points,
                _record.level,
                _record.milestone,
                _record.bag,
                new Game(new Playing()),
                _record.last_orb,
                _record.last_orb_message,
                _record.input_value,
                _record.pulled_orbs,
                _record.point_multiplier,
                _record.bomb_immunity,
                _record.active_statuses,
                _record.choice_orb_1,
                _record.choice_orb_2,
                _record.dev_mode,
                _record.risk_orbs,
                _record.risk_original_orbs,
                _record.risk_pulled_orbs,
                _record.risk_accumulated_effects,
                _record.risk_health
              );
            })()
          );
        } else {
          return model;
        }
      } else {
        return model;
      }
    }
  }
}
function handle_accept_fate(model) {
  let _block;
  let $ = model.screen;
  if ($ instanceof Testing) {
    let $1 = $[0];
    if ($1 instanceof TestingRiskReveal) {
      _block = new Testing(new TestingRiskPlaying());
    } else {
      _block = model.screen;
    }
  } else if ($ instanceof Game) {
    let $1 = $[0];
    if ($1 instanceof RiskReveal) {
      _block = new Game(new RiskPlaying());
    } else {
      _block = model.screen;
    }
  } else {
    _block = model.screen;
  }
  let screen = _block;
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    screen,
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    _record.risk_orbs,
    _record.risk_original_orbs,
    _record.risk_pulled_orbs,
    _record.risk_accumulated_effects,
    _record.risk_health
  );
}
function handle_apply_risk_effects(model) {
  let effects = model.risk_accumulated_effects;
  let total_health_change = effects.health_gained - effects.damage_taken;
  let final_health = model.health + total_health_change;
  let $ = final_health <= 0;
  if ($) {
    let _block;
    let $1 = model.screen;
    if ($1 instanceof Testing) {
      let $2 = $1[0];
      if ($2 instanceof TestingRiskSurvived) {
        _block = new Testing(new TestingRiskDied());
      } else {
        _block = model.screen;
      }
    } else if ($1 instanceof Game) {
      let $2 = $1[0];
      if ($2 instanceof RiskSurvived) {
        _block = new Game(new RiskDied());
      } else {
        _block = model.screen;
      }
    } else {
      _block = model.screen;
    }
    let death_screen = _block;
    let _record = model;
    return new Model(
      final_health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      death_screen,
      _record.last_orb,
      _record.last_orb_message,
      _record.input_value,
      _record.pulled_orbs,
      _record.point_multiplier,
      _record.bomb_immunity,
      _record.active_statuses,
      _record.choice_orb_1,
      _record.choice_orb_2,
      _record.dev_mode,
      _record.risk_orbs,
      _record.risk_original_orbs,
      _record.risk_pulled_orbs,
      _record.risk_accumulated_effects,
      _record.risk_health
    );
  } else {
    let capped_health = min(final_health, 5);
    let new_points = model.points + effects.points_gained;
    let model_with_special = fold(
      effects.special_orbs,
      model,
      (acc_model, special_orb) => {
        if (special_orb instanceof MultiplierOrb) {
          let new_multiplier = acc_model.point_multiplier * 2;
          let _pipe = acc_model;
          let _pipe$1 = add_status(
            _pipe,
            create_point_multiplier(new_multiplier)
          );
          return ((m) => {
            let _record2 = m;
            return new Model(
              _record2.health,
              _record2.points,
              _record2.level,
              _record2.milestone,
              _record2.bag,
              _record2.screen,
              _record2.last_orb,
              _record2.last_orb_message,
              _record2.input_value,
              _record2.pulled_orbs,
              new_multiplier,
              _record2.bomb_immunity,
              _record2.active_statuses,
              _record2.choice_orb_1,
              _record2.choice_orb_2,
              _record2.dev_mode,
              _record2.risk_orbs,
              _record2.risk_original_orbs,
              _record2.risk_pulled_orbs,
              _record2.risk_accumulated_effects,
              _record2.risk_health
            );
          })(_pipe$1);
        } else if (special_orb instanceof BombImmunityOrb) {
          let _pipe = acc_model;
          let _pipe$1 = add_status(
            _pipe,
            create_bomb_immunity(3)
          );
          return ((m) => {
            let _record2 = m;
            return new Model(
              _record2.health,
              _record2.points,
              _record2.level,
              _record2.milestone,
              _record2.bag,
              _record2.screen,
              _record2.last_orb,
              _record2.last_orb_message,
              _record2.input_value,
              _record2.pulled_orbs,
              _record2.point_multiplier,
              3,
              _record2.active_statuses,
              _record2.choice_orb_1,
              _record2.choice_orb_2,
              _record2.dev_mode,
              _record2.risk_orbs,
              _record2.risk_original_orbs,
              _record2.risk_pulled_orbs,
              _record2.risk_accumulated_effects,
              _record2.risk_health
            );
          })(_pipe$1);
        } else {
          return acc_model;
        }
      }
    );
    let _block;
    let $1 = model.screen;
    if ($1 instanceof Testing) {
      let $2 = $1[0];
      if ($2 instanceof TestingRiskSurvived) {
        _block = new Testing(new TestingRiskConsumed());
      } else {
        _block = model.screen;
      }
    } else if ($1 instanceof Game) {
      let $2 = $1[0];
      if ($2 instanceof RiskSurvived) {
        _block = new Game(new RiskConsumed());
      } else {
        _block = model.screen;
      }
    } else {
      _block = model.screen;
    }
    let consumption_screen = _block;
    let _record = model_with_special;
    return new Model(
      capped_health,
      new_points,
      _record.level,
      _record.milestone,
      _record.bag,
      consumption_screen,
      _record.last_orb,
      _record.last_orb_message,
      _record.input_value,
      append(model.pulled_orbs, model.risk_pulled_orbs),
      _record.point_multiplier,
      _record.bomb_immunity,
      _record.active_statuses,
      _record.choice_orb_1,
      _record.choice_orb_2,
      _record.dev_mode,
      _record.risk_orbs,
      _record.risk_original_orbs,
      _record.risk_pulled_orbs,
      _record.risk_accumulated_effects,
      _record.risk_health
    );
  }
}
function handle_continue_after_risk_consumption(model) {
  let _block;
  let _record = model;
  _block = new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    _record.screen,
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    toList([]),
    toList([]),
    toList([]),
    new RiskEffects(0, 0, 0, toList([])),
    5
  );
  let clean_model = _block;
  let $ = model.screen;
  if ($ instanceof Testing) {
    let $1 = $[0];
    if ($1 instanceof TestingRiskConsumed) {
      return check_game_status(
        (() => {
          let _record$1 = clean_model;
          return new Model(
            _record$1.health,
            _record$1.points,
            _record$1.level,
            _record$1.milestone,
            _record$1.bag,
            new Testing(new Gameplay()),
            _record$1.last_orb,
            _record$1.last_orb_message,
            _record$1.input_value,
            _record$1.pulled_orbs,
            _record$1.point_multiplier,
            _record$1.bomb_immunity,
            _record$1.active_statuses,
            _record$1.choice_orb_1,
            _record$1.choice_orb_2,
            _record$1.dev_mode,
            _record$1.risk_orbs,
            _record$1.risk_original_orbs,
            _record$1.risk_pulled_orbs,
            _record$1.risk_accumulated_effects,
            _record$1.risk_health
          );
        })()
      );
    } else {
      return clean_model;
    }
  } else if ($ instanceof Game) {
    let $1 = $[0];
    if ($1 instanceof RiskConsumed) {
      return check_game_status(
        (() => {
          let _record$1 = clean_model;
          return new Model(
            _record$1.health,
            _record$1.points,
            _record$1.level,
            _record$1.milestone,
            _record$1.bag,
            new Game(new Playing()),
            _record$1.last_orb,
            _record$1.last_orb_message,
            _record$1.input_value,
            _record$1.pulled_orbs,
            _record$1.point_multiplier,
            _record$1.bomb_immunity,
            _record$1.active_statuses,
            _record$1.choice_orb_1,
            _record$1.choice_orb_2,
            _record$1.dev_mode,
            _record$1.risk_orbs,
            _record$1.risk_original_orbs,
            _record$1.risk_pulled_orbs,
            _record$1.risk_accumulated_effects,
            _record$1.risk_health
          );
        })()
      );
    } else {
      return clean_model;
    }
  } else {
    return clean_model;
  }
}
function handle_exit_risk(model) {
  let _record = model;
  return new Model(
    _record.health,
    _record.points,
    _record.level,
    _record.milestone,
    _record.bag,
    new Game(new Playing()),
    _record.last_orb,
    _record.last_orb_message,
    _record.input_value,
    _record.pulled_orbs,
    _record.point_multiplier,
    _record.bomb_immunity,
    _record.active_statuses,
    _record.choice_orb_1,
    _record.choice_orb_2,
    _record.dev_mode,
    toList([]),
    _record.risk_original_orbs,
    toList([]),
    new RiskEffects(0, 0, 0, toList([])),
    5
  );
}
function accumulate_risk_orb(orb, current_effects, active_statuses) {
  if (orb instanceof PointOrb) {
    let value2 = orb[0];
    let multiplier = get_point_multiplier(active_statuses);
    let risk_bonus_points = value2 * 2 * multiplier;
    let _block;
    let _record = current_effects;
    _block = new RiskEffects(
      _record.health_gained,
      current_effects.points_gained + risk_bonus_points,
      _record.damage_taken,
      _record.special_orbs
    );
    let new_effects = _block;
    return [
      new_effects,
      "\u25CF RISK DATA ACQUIRED +" + to_string(risk_bonus_points)
    ];
  } else if (orb instanceof BombOrb) {
    let value2 = orb[0];
    let $ = has_bomb_immunity(active_statuses);
    if ($) {
      return [current_effects, "\u25C8 SHIELD PROTECTED FROM HAZARD"];
    } else {
      let _block;
      let _record = current_effects;
      _block = new RiskEffects(
        _record.health_gained,
        _record.points_gained,
        current_effects.damage_taken + value2,
        _record.special_orbs
      );
      let new_effects = _block;
      return [new_effects, "\u25CB HAZARD DAMAGE -" + to_string(value2)];
    }
  } else if (orb instanceof HealthOrb) {
    let value2 = orb[0];
    let _block;
    let _record = current_effects;
    _block = new RiskEffects(
      current_effects.health_gained + value2,
      _record.points_gained,
      _record.damage_taken,
      _record.special_orbs
    );
    let new_effects = _block;
    return [new_effects, "\u25C7 EMERGENCY SYSTEMS +" + to_string(value2)];
  } else {
    let special_orb = orb;
    let _block;
    let _record = current_effects;
    _block = new RiskEffects(
      _record.health_gained,
      _record.points_gained,
      _record.damage_taken,
      prepend(special_orb, current_effects.special_orbs)
    );
    let new_effects = _block;
    return [new_effects, orb_result_message(special_orb)];
  }
}
function handle_pull_risk_orb(model) {
  let $ = model.risk_orbs;
  if ($ instanceof Empty) {
    return model;
  } else {
    let first_orb = $.head;
    let rest = $.tail;
    let $1 = accumulate_risk_orb(
      first_orb,
      model.risk_accumulated_effects,
      model.active_statuses
    );
    let new_effects = $1[0];
    let orb_message = $1[1];
    let _block;
    let _record = model;
    _block = new Model(
      _record.health,
      _record.points,
      _record.level,
      _record.milestone,
      _record.bag,
      _record.screen,
      new Some(first_orb),
      new Some(orb_message),
      _record.input_value,
      _record.pulled_orbs,
      _record.point_multiplier,
      _record.bomb_immunity,
      _record.active_statuses,
      _record.choice_orb_1,
      _record.choice_orb_2,
      _record.dev_mode,
      rest,
      _record.risk_original_orbs,
      prepend(first_orb, model.risk_pulled_orbs),
      new_effects,
      _record.risk_health
    );
    let updated_model = _block;
    let $2 = is_empty(rest);
    if ($2) {
      let _block$1;
      let $3 = model.screen;
      if ($3 instanceof Testing) {
        let $4 = $3[0];
        if ($4 instanceof TestingRiskPlaying) {
          _block$1 = new Testing(new TestingRiskSurvived());
        } else {
          _block$1 = model.screen;
        }
      } else if ($3 instanceof Game) {
        let $4 = $3[0];
        if ($4 instanceof RiskPlaying) {
          _block$1 = new Game(new RiskSurvived());
        } else {
          _block$1 = model.screen;
        }
      } else {
        _block$1 = model.screen;
      }
      let screen = _block$1;
      let _record$1 = updated_model;
      return new Model(
        _record$1.health,
        _record$1.points,
        _record$1.level,
        _record$1.milestone,
        _record$1.bag,
        screen,
        _record$1.last_orb,
        _record$1.last_orb_message,
        _record$1.input_value,
        _record$1.pulled_orbs,
        _record$1.point_multiplier,
        _record$1.bomb_immunity,
        _record$1.active_statuses,
        _record$1.choice_orb_1,
        _record$1.choice_orb_2,
        _record$1.dev_mode,
        _record$1.risk_orbs,
        _record$1.risk_original_orbs,
        _record$1.risk_pulled_orbs,
        _record$1.risk_accumulated_effects,
        _record$1.risk_health
      );
    } else {
      return updated_model;
    }
  }
}
function handle_choice_orb_activation(model) {
  let $ = model.bag;
  if ($ instanceof Empty) {
    return check_game_status(model);
  } else {
    let $1 = $.tail;
    if ($1 instanceof Empty) {
      let single_orb = $.head;
      let _block;
      let _record = model;
      _block = new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        toList([single_orb]),
        _record.screen,
        _record.last_orb,
        _record.last_orb_message,
        _record.input_value,
        _record.pulled_orbs,
        _record.point_multiplier,
        _record.bomb_immunity,
        _record.active_statuses,
        _record.choice_orb_1,
        _record.choice_orb_2,
        _record.dev_mode,
        _record.risk_orbs,
        _record.risk_original_orbs,
        _record.risk_pulled_orbs,
        _record.risk_accumulated_effects,
        _record.risk_health
      );
      let temp_model = _block;
      return handle_pull_orb(temp_model);
    } else {
      let first_choice = $.head;
      let second_choice = $1.head;
      let remaining = $1.tail;
      let _block;
      let $2 = model.screen;
      if ($2 instanceof Testing) {
        let $3 = $2[0];
        if ($3 instanceof Gameplay) {
          _block = new Testing(new TestingChoosing());
        } else {
          _block = model.screen;
        }
      } else if ($2 instanceof Game) {
        let $3 = $2[0];
        if ($3 instanceof Playing) {
          _block = new Game(new Choosing());
        } else {
          _block = model.screen;
        }
      } else {
        _block = model.screen;
      }
      let screen = _block;
      let _block$1;
      let _record = model;
      _block$1 = new Model(
        _record.health,
        _record.points,
        _record.level,
        _record.milestone,
        remaining,
        screen,
        _record.last_orb,
        _record.last_orb_message,
        _record.input_value,
        _record.pulled_orbs,
        _record.point_multiplier,
        _record.bomb_immunity,
        _record.active_statuses,
        new Some(first_choice),
        new Some(second_choice),
        _record.dev_mode,
        _record.risk_orbs,
        _record.risk_original_orbs,
        _record.risk_pulled_orbs,
        _record.risk_accumulated_effects,
        _record.risk_health
      );
      let choice_model = _block$1;
      return choice_model;
    }
  }
}
function handle_pull_orb(model) {
  let $ = model.screen;
  if ($ instanceof Testing) {
    let $1 = $[0];
    if ($1 instanceof Gameplay) {
      let $2 = model.bag;
      if ($2 instanceof Empty) {
        return check_game_status(model);
      } else {
        let first_orb = $2.head;
        let rest = $2.tail;
        let _block;
        if (first_orb instanceof PointOrb) {
          let value2 = first_orb[0];
          let multiplier = get_point_multiplier(model.active_statuses);
          let points = value2 * multiplier;
          let _block$12;
          let _record2 = model;
          _block$12 = new Model(
            _record2.health,
            model.points + points,
            _record2.level,
            _record2.milestone,
            _record2.bag,
            _record2.screen,
            _record2.last_orb,
            _record2.last_orb_message,
            _record2.input_value,
            _record2.pulled_orbs,
            _record2.point_multiplier,
            _record2.bomb_immunity,
            _record2.active_statuses,
            _record2.choice_orb_1,
            _record2.choice_orb_2,
            _record2.dev_mode,
            _record2.risk_orbs,
            _record2.risk_original_orbs,
            _record2.risk_pulled_orbs,
            _record2.risk_accumulated_effects,
            _record2.risk_health
          );
          let new_model2 = _block$12;
          let message = orb_result_message(first_orb);
          _block = [new_model2, message, false];
        } else if (first_orb instanceof BombOrb) {
          let value2 = first_orb[0];
          let $4 = has_bomb_immunity(model.active_statuses);
          if ($4) {
            let new_model2 = model;
            let message = "Bomb immunity protected you! Bomb returned to container.";
            _block = [new_model2, message, true];
          } else {
            let _block$12;
            let _record2 = model;
            _block$12 = new Model(
              model.health - value2,
              _record2.points,
              _record2.level,
              _record2.milestone,
              _record2.bag,
              _record2.screen,
              _record2.last_orb,
              _record2.last_orb_message,
              _record2.input_value,
              _record2.pulled_orbs,
              _record2.point_multiplier,
              _record2.bomb_immunity,
              _record2.active_statuses,
              _record2.choice_orb_1,
              _record2.choice_orb_2,
              _record2.dev_mode,
              _record2.risk_orbs,
              _record2.risk_original_orbs,
              _record2.risk_pulled_orbs,
              _record2.risk_accumulated_effects,
              _record2.risk_health
            );
            let new_model2 = _block$12;
            let message = orb_result_message(first_orb);
            _block = [new_model2, message, false];
          }
        } else if (first_orb instanceof HealthOrb) {
          let value2 = first_orb[0];
          let new_health = min(model.health + value2, 5);
          let _block$12;
          let _record2 = model;
          _block$12 = new Model(
            new_health,
            _record2.points,
            _record2.level,
            _record2.milestone,
            _record2.bag,
            _record2.screen,
            _record2.last_orb,
            _record2.last_orb_message,
            _record2.input_value,
            _record2.pulled_orbs,
            _record2.point_multiplier,
            _record2.bomb_immunity,
            _record2.active_statuses,
            _record2.choice_orb_1,
            _record2.choice_orb_2,
            _record2.dev_mode,
            _record2.risk_orbs,
            _record2.risk_original_orbs,
            _record2.risk_pulled_orbs,
            _record2.risk_accumulated_effects,
            _record2.risk_health
          );
          let new_model2 = _block$12;
          let message = orb_result_message(first_orb);
          _block = [new_model2, message, false];
        } else if (first_orb instanceof AllCollectorOrb) {
          let collector_value = first_orb[0];
          let multiplier = get_point_multiplier(model.active_statuses);
          let bonus_points = length(rest) * collector_value * multiplier;
          let _block$12;
          let _record2 = model;
          _block$12 = new Model(
            _record2.health,
            model.points + bonus_points,
            _record2.level,
            _record2.milestone,
            _record2.bag,
            _record2.screen,
            _record2.last_orb,
            _record2.last_orb_message,
            _record2.input_value,
            _record2.pulled_orbs,
            _record2.point_multiplier,
            _record2.bomb_immunity,
            _record2.active_statuses,
            _record2.choice_orb_1,
            _record2.choice_orb_2,
            _record2.dev_mode,
            _record2.risk_orbs,
            _record2.risk_original_orbs,
            _record2.risk_pulled_orbs,
            _record2.risk_accumulated_effects,
            _record2.risk_health
          );
          let new_model2 = _block$12;
          let message = collector_result_message(
            first_orb,
            bonus_points
          );
          _block = [new_model2, message, false];
        } else if (first_orb instanceof PointCollectorOrb) {
          let collector_value = first_orb[0];
          let multiplier = get_point_multiplier(model.active_statuses);
          let bonus_points = count_point_orbs(rest) * collector_value * multiplier;
          let _block$12;
          let _record2 = model;
          _block$12 = new Model(
            _record2.health,
            model.points + bonus_points,
            _record2.level,
            _record2.milestone,
            _record2.bag,
            _record2.screen,
            _record2.last_orb,
            _record2.last_orb_message,
            _record2.input_value,
            _record2.pulled_orbs,
            _record2.point_multiplier,
            _record2.bomb_immunity,
            _record2.active_statuses,
            _record2.choice_orb_1,
            _record2.choice_orb_2,
            _record2.dev_mode,
            _record2.risk_orbs,
            _record2.risk_original_orbs,
            _record2.risk_pulled_orbs,
            _record2.risk_accumulated_effects,
            _record2.risk_health
          );
          let new_model2 = _block$12;
          let message = collector_result_message(
            first_orb,
            bonus_points
          );
          _block = [new_model2, message, false];
        } else if (first_orb instanceof BombSurvivorOrb) {
          let collector_value = first_orb[0];
          let multiplier = get_point_multiplier(model.active_statuses);
          let bonus_points = count_pulled_bomb_orbs(model.pulled_orbs) * collector_value * multiplier;
          let _block$12;
          let _record2 = model;
          _block$12 = new Model(
            _record2.health,
            model.points + bonus_points,
            _record2.level,
            _record2.milestone,
            _record2.bag,
            _record2.screen,
            _record2.last_orb,
            _record2.last_orb_message,
            _record2.input_value,
            _record2.pulled_orbs,
            _record2.point_multiplier,
            _record2.bomb_immunity,
            _record2.active_statuses,
            _record2.choice_orb_1,
            _record2.choice_orb_2,
            _record2.dev_mode,
            _record2.risk_orbs,
            _record2.risk_original_orbs,
            _record2.risk_pulled_orbs,
            _record2.risk_accumulated_effects,
            _record2.risk_health
          );
          let new_model2 = _block$12;
          let message = collector_result_message(
            first_orb,
            bonus_points
          );
          _block = [new_model2, message, false];
        } else if (first_orb instanceof MultiplierOrb) {
          let new_multiplier = model.point_multiplier * 2;
          let _block$12;
          let _pipe = model;
          let _pipe$1 = add_status(
            _pipe,
            create_point_multiplier(new_multiplier)
          );
          _block$12 = ((m) => {
            let _record2 = m;
            return new Model(
              _record2.health,
              _record2.points,
              _record2.level,
              _record2.milestone,
              _record2.bag,
              _record2.screen,
              _record2.last_orb,
              _record2.last_orb_message,
              _record2.input_value,
              _record2.pulled_orbs,
              new_multiplier,
              _record2.bomb_immunity,
              _record2.active_statuses,
              _record2.choice_orb_1,
              _record2.choice_orb_2,
              _record2.dev_mode,
              _record2.risk_orbs,
              _record2.risk_original_orbs,
              _record2.risk_pulled_orbs,
              _record2.risk_accumulated_effects,
              _record2.risk_health
            );
          })(_pipe$1);
          let new_model2 = _block$12;
          let message = orb_result_message(first_orb);
          _block = [new_model2, message, false];
        } else if (first_orb instanceof BombImmunityOrb) {
          let _block$12;
          let _pipe = model;
          let _pipe$1 = add_status(
            _pipe,
            create_bomb_immunity(3)
          );
          _block$12 = ((m) => {
            let _record2 = m;
            return new Model(
              _record2.health,
              _record2.points,
              _record2.level,
              _record2.milestone,
              _record2.bag,
              _record2.screen,
              _record2.last_orb,
              _record2.last_orb_message,
              _record2.input_value,
              _record2.pulled_orbs,
              _record2.point_multiplier,
              3,
              _record2.active_statuses,
              _record2.choice_orb_1,
              _record2.choice_orb_2,
              _record2.dev_mode,
              _record2.risk_orbs,
              _record2.risk_original_orbs,
              _record2.risk_pulled_orbs,
              _record2.risk_accumulated_effects,
              _record2.risk_health
            );
          })(_pipe$1);
          let new_model2 = _block$12;
          let message = orb_result_message(first_orb);
          _block = [new_model2, message, false];
        } else if (first_orb instanceof ChoiceOrb) {
          let message = orb_result_message(first_orb);
          _block = [model, message, false];
        } else if (first_orb instanceof RiskOrb) {
          let message = orb_result_message(first_orb);
          _block = [model, message, false];
        } else {
          let $4 = find_lowest_point_orb(model.pulled_orbs);
          if ($4 instanceof Some) {
            let lowest_point_orb = $4[0];
            let updated_pulled_orbs = filter(
              model.pulled_orbs,
              (orb) => {
                return !isEqual(orb, lowest_point_orb);
              }
            );
            let _block$12;
            let _record2 = model;
            _block$12 = new Model(
              _record2.health,
              _record2.points,
              _record2.level,
              _record2.milestone,
              _record2.bag,
              _record2.screen,
              _record2.last_orb,
              _record2.last_orb_message,
              _record2.input_value,
              updated_pulled_orbs,
              _record2.point_multiplier,
              _record2.bomb_immunity,
              _record2.active_statuses,
              _record2.choice_orb_1,
              _record2.choice_orb_2,
              _record2.dev_mode,
              _record2.risk_orbs,
              _record2.risk_original_orbs,
              _record2.risk_pulled_orbs,
              _record2.risk_accumulated_effects,
              _record2.risk_health
            );
            let new_model2 = _block$12;
            let message = orb_result_message(first_orb);
            _block = [new_model2, message, false];
          } else {
            let message = orb_result_message(first_orb);
            _block = [model, message, false];
          }
        }
        let $3 = _block;
        let new_model = $3[0];
        let orb_message = $3[1];
        let return_orb_to_bag = $3[2];
        let _block$1;
        if (return_orb_to_bag) {
          _block$1 = append(rest, toList([first_orb]));
        } else {
          if (first_orb instanceof PointRecoveryOrb) {
            let $4 = find_lowest_point_orb(model.pulled_orbs);
            if ($4 instanceof Some) {
              let lowest_point_orb = $4[0];
              _block$1 = append(rest, toList([lowest_point_orb]));
            } else {
              _block$1 = rest;
            }
          } else {
            _block$1 = rest;
          }
        }
        let new_bag = _block$1;
        let _block$2;
        if (first_orb instanceof BombImmunityOrb) {
          _block$2 = new_model.bomb_immunity;
        } else {
          let $4 = new_model.bomb_immunity > 0;
          if ($4) {
            _block$2 = new_model.bomb_immunity - 1;
          } else {
            _block$2 = 0;
          }
        }
        let new_immunity = _block$2;
        let _block$3;
        let _record = new_model;
        _block$3 = new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          new_bag,
          _record.screen,
          new Some(first_orb),
          new Some(orb_message),
          _record.input_value,
          (() => {
            if (return_orb_to_bag) {
              return model.pulled_orbs;
            } else {
              return prepend(first_orb, model.pulled_orbs);
            }
          })(),
          _record.point_multiplier,
          new_immunity,
          _record.active_statuses,
          _record.choice_orb_1,
          _record.choice_orb_2,
          _record.dev_mode,
          _record.risk_orbs,
          _record.risk_original_orbs,
          _record.risk_pulled_orbs,
          _record.risk_accumulated_effects,
          _record.risk_health
        );
        let model_with_bag_and_pulls = _block$3;
        let _block$4;
        if (first_orb instanceof BombImmunityOrb) {
          _block$4 = model_with_bag_and_pulls;
        } else {
          _block$4 = tick_statuses(model_with_bag_and_pulls);
        }
        let updated_model = _block$4;
        if (first_orb instanceof ChoiceOrb) {
          return handle_choice_orb_activation(updated_model);
        } else if (first_orb instanceof RiskOrb) {
          return handle_risk_orb_activation(updated_model);
        } else {
          return check_game_status(updated_model);
        }
      }
    } else {
      return model;
    }
  } else if ($ instanceof Game) {
    let $1 = $[0];
    if ($1 instanceof Playing) {
      let $2 = model.bag;
      if ($2 instanceof Empty) {
        return check_game_status(model);
      } else {
        let first_orb = $2.head;
        let rest = $2.tail;
        let _block;
        if (first_orb instanceof PointOrb) {
          let value2 = first_orb[0];
          let multiplier = get_point_multiplier(model.active_statuses);
          let points = value2 * multiplier;
          let _block$12;
          let _record2 = model;
          _block$12 = new Model(
            _record2.health,
            model.points + points,
            _record2.level,
            _record2.milestone,
            _record2.bag,
            _record2.screen,
            _record2.last_orb,
            _record2.last_orb_message,
            _record2.input_value,
            _record2.pulled_orbs,
            _record2.point_multiplier,
            _record2.bomb_immunity,
            _record2.active_statuses,
            _record2.choice_orb_1,
            _record2.choice_orb_2,
            _record2.dev_mode,
            _record2.risk_orbs,
            _record2.risk_original_orbs,
            _record2.risk_pulled_orbs,
            _record2.risk_accumulated_effects,
            _record2.risk_health
          );
          let new_model2 = _block$12;
          let message = orb_result_message(first_orb);
          _block = [new_model2, message, false];
        } else if (first_orb instanceof BombOrb) {
          let value2 = first_orb[0];
          let $4 = has_bomb_immunity(model.active_statuses);
          if ($4) {
            let new_model2 = model;
            let message = "Bomb immunity protected you! Bomb returned to container.";
            _block = [new_model2, message, true];
          } else {
            let _block$12;
            let _record2 = model;
            _block$12 = new Model(
              model.health - value2,
              _record2.points,
              _record2.level,
              _record2.milestone,
              _record2.bag,
              _record2.screen,
              _record2.last_orb,
              _record2.last_orb_message,
              _record2.input_value,
              _record2.pulled_orbs,
              _record2.point_multiplier,
              _record2.bomb_immunity,
              _record2.active_statuses,
              _record2.choice_orb_1,
              _record2.choice_orb_2,
              _record2.dev_mode,
              _record2.risk_orbs,
              _record2.risk_original_orbs,
              _record2.risk_pulled_orbs,
              _record2.risk_accumulated_effects,
              _record2.risk_health
            );
            let new_model2 = _block$12;
            let message = orb_result_message(first_orb);
            _block = [new_model2, message, false];
          }
        } else if (first_orb instanceof HealthOrb) {
          let value2 = first_orb[0];
          let new_health = min(model.health + value2, 5);
          let _block$12;
          let _record2 = model;
          _block$12 = new Model(
            new_health,
            _record2.points,
            _record2.level,
            _record2.milestone,
            _record2.bag,
            _record2.screen,
            _record2.last_orb,
            _record2.last_orb_message,
            _record2.input_value,
            _record2.pulled_orbs,
            _record2.point_multiplier,
            _record2.bomb_immunity,
            _record2.active_statuses,
            _record2.choice_orb_1,
            _record2.choice_orb_2,
            _record2.dev_mode,
            _record2.risk_orbs,
            _record2.risk_original_orbs,
            _record2.risk_pulled_orbs,
            _record2.risk_accumulated_effects,
            _record2.risk_health
          );
          let new_model2 = _block$12;
          let message = orb_result_message(first_orb);
          _block = [new_model2, message, false];
        } else if (first_orb instanceof AllCollectorOrb) {
          let collector_value = first_orb[0];
          let multiplier = get_point_multiplier(model.active_statuses);
          let bonus_points = length(rest) * collector_value * multiplier;
          let _block$12;
          let _record2 = model;
          _block$12 = new Model(
            _record2.health,
            model.points + bonus_points,
            _record2.level,
            _record2.milestone,
            _record2.bag,
            _record2.screen,
            _record2.last_orb,
            _record2.last_orb_message,
            _record2.input_value,
            _record2.pulled_orbs,
            _record2.point_multiplier,
            _record2.bomb_immunity,
            _record2.active_statuses,
            _record2.choice_orb_1,
            _record2.choice_orb_2,
            _record2.dev_mode,
            _record2.risk_orbs,
            _record2.risk_original_orbs,
            _record2.risk_pulled_orbs,
            _record2.risk_accumulated_effects,
            _record2.risk_health
          );
          let new_model2 = _block$12;
          let message = collector_result_message(
            first_orb,
            bonus_points
          );
          _block = [new_model2, message, false];
        } else if (first_orb instanceof PointCollectorOrb) {
          let collector_value = first_orb[0];
          let multiplier = get_point_multiplier(model.active_statuses);
          let bonus_points = count_point_orbs(rest) * collector_value * multiplier;
          let _block$12;
          let _record2 = model;
          _block$12 = new Model(
            _record2.health,
            model.points + bonus_points,
            _record2.level,
            _record2.milestone,
            _record2.bag,
            _record2.screen,
            _record2.last_orb,
            _record2.last_orb_message,
            _record2.input_value,
            _record2.pulled_orbs,
            _record2.point_multiplier,
            _record2.bomb_immunity,
            _record2.active_statuses,
            _record2.choice_orb_1,
            _record2.choice_orb_2,
            _record2.dev_mode,
            _record2.risk_orbs,
            _record2.risk_original_orbs,
            _record2.risk_pulled_orbs,
            _record2.risk_accumulated_effects,
            _record2.risk_health
          );
          let new_model2 = _block$12;
          let message = collector_result_message(
            first_orb,
            bonus_points
          );
          _block = [new_model2, message, false];
        } else if (first_orb instanceof BombSurvivorOrb) {
          let collector_value = first_orb[0];
          let multiplier = get_point_multiplier(model.active_statuses);
          let bonus_points = count_pulled_bomb_orbs(model.pulled_orbs) * collector_value * multiplier;
          let _block$12;
          let _record2 = model;
          _block$12 = new Model(
            _record2.health,
            model.points + bonus_points,
            _record2.level,
            _record2.milestone,
            _record2.bag,
            _record2.screen,
            _record2.last_orb,
            _record2.last_orb_message,
            _record2.input_value,
            _record2.pulled_orbs,
            _record2.point_multiplier,
            _record2.bomb_immunity,
            _record2.active_statuses,
            _record2.choice_orb_1,
            _record2.choice_orb_2,
            _record2.dev_mode,
            _record2.risk_orbs,
            _record2.risk_original_orbs,
            _record2.risk_pulled_orbs,
            _record2.risk_accumulated_effects,
            _record2.risk_health
          );
          let new_model2 = _block$12;
          let message = collector_result_message(
            first_orb,
            bonus_points
          );
          _block = [new_model2, message, false];
        } else if (first_orb instanceof MultiplierOrb) {
          let new_multiplier = model.point_multiplier * 2;
          let _block$12;
          let _pipe = model;
          let _pipe$1 = add_status(
            _pipe,
            create_point_multiplier(new_multiplier)
          );
          _block$12 = ((m) => {
            let _record2 = m;
            return new Model(
              _record2.health,
              _record2.points,
              _record2.level,
              _record2.milestone,
              _record2.bag,
              _record2.screen,
              _record2.last_orb,
              _record2.last_orb_message,
              _record2.input_value,
              _record2.pulled_orbs,
              new_multiplier,
              _record2.bomb_immunity,
              _record2.active_statuses,
              _record2.choice_orb_1,
              _record2.choice_orb_2,
              _record2.dev_mode,
              _record2.risk_orbs,
              _record2.risk_original_orbs,
              _record2.risk_pulled_orbs,
              _record2.risk_accumulated_effects,
              _record2.risk_health
            );
          })(_pipe$1);
          let new_model2 = _block$12;
          let message = orb_result_message(first_orb);
          _block = [new_model2, message, false];
        } else if (first_orb instanceof BombImmunityOrb) {
          let _block$12;
          let _pipe = model;
          let _pipe$1 = add_status(
            _pipe,
            create_bomb_immunity(3)
          );
          _block$12 = ((m) => {
            let _record2 = m;
            return new Model(
              _record2.health,
              _record2.points,
              _record2.level,
              _record2.milestone,
              _record2.bag,
              _record2.screen,
              _record2.last_orb,
              _record2.last_orb_message,
              _record2.input_value,
              _record2.pulled_orbs,
              _record2.point_multiplier,
              3,
              _record2.active_statuses,
              _record2.choice_orb_1,
              _record2.choice_orb_2,
              _record2.dev_mode,
              _record2.risk_orbs,
              _record2.risk_original_orbs,
              _record2.risk_pulled_orbs,
              _record2.risk_accumulated_effects,
              _record2.risk_health
            );
          })(_pipe$1);
          let new_model2 = _block$12;
          let message = orb_result_message(first_orb);
          _block = [new_model2, message, false];
        } else if (first_orb instanceof ChoiceOrb) {
          let message = orb_result_message(first_orb);
          _block = [model, message, false];
        } else if (first_orb instanceof RiskOrb) {
          let message = orb_result_message(first_orb);
          _block = [model, message, false];
        } else {
          let $4 = find_lowest_point_orb(model.pulled_orbs);
          if ($4 instanceof Some) {
            let lowest_point_orb = $4[0];
            let updated_pulled_orbs = filter(
              model.pulled_orbs,
              (orb) => {
                return !isEqual(orb, lowest_point_orb);
              }
            );
            let _block$12;
            let _record2 = model;
            _block$12 = new Model(
              _record2.health,
              _record2.points,
              _record2.level,
              _record2.milestone,
              _record2.bag,
              _record2.screen,
              _record2.last_orb,
              _record2.last_orb_message,
              _record2.input_value,
              updated_pulled_orbs,
              _record2.point_multiplier,
              _record2.bomb_immunity,
              _record2.active_statuses,
              _record2.choice_orb_1,
              _record2.choice_orb_2,
              _record2.dev_mode,
              _record2.risk_orbs,
              _record2.risk_original_orbs,
              _record2.risk_pulled_orbs,
              _record2.risk_accumulated_effects,
              _record2.risk_health
            );
            let new_model2 = _block$12;
            let message = orb_result_message(first_orb);
            _block = [new_model2, message, false];
          } else {
            let message = orb_result_message(first_orb);
            _block = [model, message, false];
          }
        }
        let $3 = _block;
        let new_model = $3[0];
        let orb_message = $3[1];
        let return_orb_to_bag = $3[2];
        let _block$1;
        if (return_orb_to_bag) {
          _block$1 = append(rest, toList([first_orb]));
        } else {
          if (first_orb instanceof PointRecoveryOrb) {
            let $4 = find_lowest_point_orb(model.pulled_orbs);
            if ($4 instanceof Some) {
              let lowest_point_orb = $4[0];
              _block$1 = append(rest, toList([lowest_point_orb]));
            } else {
              _block$1 = rest;
            }
          } else {
            _block$1 = rest;
          }
        }
        let new_bag = _block$1;
        let _block$2;
        if (first_orb instanceof BombImmunityOrb) {
          _block$2 = new_model.bomb_immunity;
        } else {
          let $4 = new_model.bomb_immunity > 0;
          if ($4) {
            _block$2 = new_model.bomb_immunity - 1;
          } else {
            _block$2 = 0;
          }
        }
        let new_immunity = _block$2;
        let _block$3;
        let _record = new_model;
        _block$3 = new Model(
          _record.health,
          _record.points,
          _record.level,
          _record.milestone,
          new_bag,
          _record.screen,
          new Some(first_orb),
          new Some(orb_message),
          _record.input_value,
          (() => {
            if (return_orb_to_bag) {
              return model.pulled_orbs;
            } else {
              return prepend(first_orb, model.pulled_orbs);
            }
          })(),
          _record.point_multiplier,
          new_immunity,
          _record.active_statuses,
          _record.choice_orb_1,
          _record.choice_orb_2,
          _record.dev_mode,
          _record.risk_orbs,
          _record.risk_original_orbs,
          _record.risk_pulled_orbs,
          _record.risk_accumulated_effects,
          _record.risk_health
        );
        let model_with_bag_and_pulls = _block$3;
        let _block$4;
        if (first_orb instanceof BombImmunityOrb) {
          _block$4 = model_with_bag_and_pulls;
        } else {
          _block$4 = tick_statuses(model_with_bag_and_pulls);
        }
        let updated_model = _block$4;
        if (first_orb instanceof ChoiceOrb) {
          return handle_choice_orb_activation(updated_model);
        } else if (first_orb instanceof RiskOrb) {
          return handle_risk_orb_activation(updated_model);
        } else {
          return check_game_status(updated_model);
        }
      }
    } else {
      return model;
    }
  } else {
    return model;
  }
}
function handle_choose_orb(model, choice_index) {
  let $ = model.screen;
  let $1 = model.choice_orb_1;
  let $2 = model.choice_orb_2;
  if ($2 instanceof Some) {
    if ($1 instanceof Some) {
      if ($ instanceof Testing) {
        let $3 = $[0];
        if ($3 instanceof TestingChoosing) {
          let second_choice = $2[0];
          let first_choice = $1[0];
          let _block;
          if (choice_index === 0) {
            _block = first_choice;
          } else {
            _block = second_choice;
          }
          let chosen_orb = _block;
          let _block$1;
          if (choice_index === 0) {
            _block$1 = second_choice;
          } else {
            _block$1 = first_choice;
          }
          let unchosen_orb = _block$1;
          let new_bag = append(model.bag, toList([unchosen_orb]));
          let _block$2;
          let _record = model;
          _block$2 = new Model(
            _record.health,
            _record.points,
            _record.level,
            _record.milestone,
            prepend(chosen_orb, new_bag),
            new Testing(new Gameplay()),
            _record.last_orb,
            _record.last_orb_message,
            _record.input_value,
            _record.pulled_orbs,
            _record.point_multiplier,
            _record.bomb_immunity,
            _record.active_statuses,
            new None(),
            new None(),
            _record.dev_mode,
            _record.risk_orbs,
            _record.risk_original_orbs,
            _record.risk_pulled_orbs,
            _record.risk_accumulated_effects,
            _record.risk_health
          );
          let temp_model = _block$2;
          return handle_pull_orb(temp_model);
        } else {
          return model;
        }
      } else if ($ instanceof Game) {
        let $3 = $[0];
        if ($3 instanceof Choosing) {
          let second_choice = $2[0];
          let first_choice = $1[0];
          let _block;
          if (choice_index === 0) {
            _block = first_choice;
          } else {
            _block = second_choice;
          }
          let chosen_orb = _block;
          let _block$1;
          if (choice_index === 0) {
            _block$1 = second_choice;
          } else {
            _block$1 = first_choice;
          }
          let unchosen_orb = _block$1;
          let new_bag = append(model.bag, toList([unchosen_orb]));
          let _block$2;
          let _record = model;
          _block$2 = new Model(
            _record.health,
            _record.points,
            _record.level,
            _record.milestone,
            prepend(chosen_orb, new_bag),
            new Game(new Playing()),
            _record.last_orb,
            _record.last_orb_message,
            _record.input_value,
            _record.pulled_orbs,
            _record.point_multiplier,
            _record.bomb_immunity,
            _record.active_statuses,
            new None(),
            new None(),
            _record.dev_mode,
            _record.risk_orbs,
            _record.risk_original_orbs,
            _record.risk_pulled_orbs,
            _record.risk_accumulated_effects,
            _record.risk_health
          );
          let temp_model = _block$2;
          return handle_pull_orb(temp_model);
        } else {
          return model;
        }
      } else {
        return model;
      }
    } else {
      return model;
    }
  } else {
    return model;
  }
}
function update2(model, msg) {
  if (msg instanceof StartGame) {
    return handle_start_game(model);
  } else if (msg instanceof GoToOrbTesting) {
    return handle_go_to_orb_testing(model);
  } else if (msg instanceof SelectOrbType) {
    let orb_type = msg[0];
    return handle_select_orb_type(model, orb_type);
  } else if (msg instanceof UpdateInputValue) {
    let value2 = msg[0];
    return handle_update_input_value(model, value2);
  } else if (msg instanceof ConfirmOrbValue) {
    let orb_type = msg[0];
    return handle_confirm_orb_value(model, orb_type);
  } else if (msg instanceof BackToMainMenu) {
    return handle_back_to_main_menu(model);
  } else if (msg instanceof BackToOrbTesting) {
    return handle_back_to_orb_testing(model);
  } else if (msg instanceof StartTestingWithBothStatuses) {
    return handle_start_testing_with_both_statuses(model);
  } else if (msg instanceof StartTestingWithTripleChoice) {
    return handle_start_testing_with_triple_choice(model);
  } else if (msg instanceof StartTestingRiskSuccess) {
    return handle_start_testing_risk_success(model);
  } else if (msg instanceof StartTestingRiskFailure) {
    return handle_start_testing_risk_failure(model);
  } else if (msg instanceof StartTestingRiskContinue) {
    return handle_start_testing_risk_continue(model);
  } else if (msg instanceof StartTestingPointRecoveryFirst) {
    return handle_start_testing_point_recovery_first(model);
  } else if (msg instanceof StartTestingPointRecoveryActive) {
    return handle_start_testing_point_recovery_active(model);
  } else if (msg instanceof PullOrb) {
    return handle_pull_orb(model);
  } else if (msg instanceof NextLevel) {
    return handle_next_level(model);
  } else if (msg instanceof RestartGame) {
    return handle_restart_game(model);
  } else if (msg instanceof ResetTesting) {
    return handle_reset_testing(model);
  } else if (msg instanceof ExitTesting) {
    return handle_exit_testing(model);
  } else if (msg instanceof ChooseOrb) {
    let choice_index = msg[0];
    return handle_choose_orb(model, choice_index);
  } else if (msg instanceof ToggleDevMode) {
    return handle_toggle_dev_mode(model);
  } else if (msg instanceof AcceptRisk) {
    let accept = msg[0];
    return handle_accept_risk(model, accept);
  } else if (msg instanceof AcceptFate) {
    return handle_accept_fate(model);
  } else if (msg instanceof PullRiskOrb) {
    return handle_pull_risk_orb(model);
  } else if (msg instanceof ApplyRiskEffects) {
    return handle_apply_risk_effects(model);
  } else if (msg instanceof ContinueAfterRiskConsumption) {
    return handle_continue_after_risk_consumption(model);
  } else {
    return handle_exit_risk(model);
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
function on_input(msg) {
  return on(
    "input",
    subfield(
      toList(["target", "value"]),
      string2,
      (value2) => {
        return success(msg(value2));
      }
    )
  );
}

// build/dev/javascript/newmoon/ui.mjs
function app_container(content) {
  return div(
    toList([
      class$(
        "min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4"
      )
    ]),
    toList([content])
  );
}
function game_card(content) {
  return div(
    toList([
      class$(
        "bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center border border-gray-200 flex flex-col gap-3"
      )
    ]),
    content
  );
}
function game_header() {
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
function stats_grid(stats) {
  return div(toList([class$("grid grid-cols-2 gap-3")]), stats);
}
function stat_card(symbol, label2, value2, color_class) {
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
        toList([text3(value2)])
      )
    ])
  );
}
function info_panel(message, text_class, bg_class) {
  return div(
    toList([class$("p-3 " + bg_class + " rounded border")]),
    toList([
      p(
        toList([class$(text_class + " font-light text-sm")]),
        toList([text3(message)])
      )
    ])
  );
}
function orb_result_display(orb, message) {
  if (orb instanceof Some) {
    if (message instanceof Some) {
      let orb_value = orb[0];
      let orb_message = message[0];
      if (orb_value instanceof PointOrb) {
        return info_panel(
          orb_message,
          "text-gray-700",
          "bg-gray-50 border-gray-200"
        );
      } else if (orb_value instanceof BombOrb) {
        return info_panel(
          orb_message,
          "text-gray-800",
          "bg-gray-100 border-gray-300"
        );
      } else if (orb_value instanceof HealthOrb) {
        return info_panel(
          orb_message,
          "text-green-700",
          "bg-green-50 border-green-200"
        );
      } else if (orb_value instanceof AllCollectorOrb) {
        return info_panel(
          orb_message,
          "text-purple-700",
          "bg-purple-50 border-purple-200"
        );
      } else if (orb_value instanceof PointCollectorOrb) {
        return info_panel(
          orb_message,
          "text-blue-700",
          "bg-blue-50 border-blue-200"
        );
      } else if (orb_value instanceof BombSurvivorOrb) {
        return info_panel(
          orb_message,
          "text-orange-700",
          "bg-orange-50 border-orange-200"
        );
      } else if (orb_value instanceof MultiplierOrb) {
        return info_panel(
          orb_message,
          "text-yellow-700",
          "bg-yellow-50 border-yellow-200"
        );
      } else if (orb_value instanceof BombImmunityOrb) {
        return info_panel(
          orb_message,
          "text-cyan-700",
          "bg-cyan-50 border-cyan-200"
        );
      } else if (orb_value instanceof ChoiceOrb) {
        return info_panel(
          orb_message,
          "text-indigo-700",
          "bg-indigo-50 border-indigo-200"
        );
      } else if (orb_value instanceof RiskOrb) {
        return info_panel(
          orb_message,
          "text-orange-700",
          "bg-orange-50 border-orange-200"
        );
      } else {
        return info_panel(
          orb_message,
          "text-teal-700",
          "bg-teal-50 border-teal-200"
        );
      }
    } else {
      let orb_value = orb[0];
      let fallback_message = orb_result_message(orb_value);
      if (orb_value instanceof PointOrb) {
        return info_panel(
          fallback_message,
          "text-gray-700",
          "bg-gray-50 border-gray-200"
        );
      } else if (orb_value instanceof BombOrb) {
        return info_panel(
          fallback_message,
          "text-gray-800",
          "bg-gray-100 border-gray-300"
        );
      } else if (orb_value instanceof HealthOrb) {
        return info_panel(
          fallback_message,
          "text-green-700",
          "bg-green-50 border-green-200"
        );
      } else if (orb_value instanceof AllCollectorOrb) {
        return info_panel(
          fallback_message,
          "text-purple-700",
          "bg-purple-50 border-purple-200"
        );
      } else if (orb_value instanceof PointCollectorOrb) {
        return info_panel(
          fallback_message,
          "text-blue-700",
          "bg-blue-50 border-blue-200"
        );
      } else if (orb_value instanceof BombSurvivorOrb) {
        return info_panel(
          fallback_message,
          "text-orange-700",
          "bg-orange-50 border-orange-200"
        );
      } else if (orb_value instanceof MultiplierOrb) {
        return info_panel(
          fallback_message,
          "text-yellow-700",
          "bg-yellow-50 border-yellow-200"
        );
      } else if (orb_value instanceof BombImmunityOrb) {
        return info_panel(
          fallback_message,
          "text-cyan-700",
          "bg-cyan-50 border-cyan-200"
        );
      } else if (orb_value instanceof ChoiceOrb) {
        return info_panel(
          fallback_message,
          "text-indigo-700",
          "bg-indigo-50 border-indigo-200"
        );
      } else if (orb_value instanceof RiskOrb) {
        return info_panel(
          fallback_message,
          "text-orange-700",
          "bg-orange-50 border-orange-200"
        );
      } else {
        return info_panel(
          fallback_message,
          "text-teal-700",
          "bg-teal-50 border-teal-200"
        );
      }
    }
  } else {
    return div(toList([class$("h-8")]), toList([]));
  }
}
function container_display(orbs_left) {
  return div(
    toList([class$("p-4 bg-gray-50 rounded border border-gray-100")]),
    toList([
      p(
        toList([
          class$(
            "text-gray-500 mb-2 text-sm font-light tracking-wide"
          )
        ]),
        toList([text3(container_label)])
      ),
      p(
        toList([class$("text-2xl font-light text-black")]),
        toList([
          text3(
            concat2(
              toList([to_string(orbs_left), specimens_suffix])
            )
          )
        ])
      )
    ])
  );
}
function extract_button(is_disabled) {
  let _block;
  if (is_disabled) {
    _block = "bg-gray-200 cursor-not-allowed text-gray-400 border-gray-200";
  } else {
    _block = "bg-black hover:bg-gray-800 text-white border-black hover:scale-[1.02]";
  }
  let button_classes = _block;
  return button(
    toList([
      class$(
        concat2(
          toList([
            "w-full py-4 px-6 rounded border font-light text-sm tracking-wider transition transform ",
            button_classes
          ])
        )
      ),
      on_click(new PullOrb())
    ]),
    toList([text3(extract_button_text)])
  );
}
function primary_button(text4, msg) {
  return button(
    toList([
      class$(
        "w-full bg-black hover:bg-gray-800 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
      ),
      on_click(msg)
    ]),
    toList([text3(text4)])
  );
}
function secondary_button(text4, msg) {
  return button(
    toList([
      class$(
        "w-full bg-gray-800 hover:bg-black text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
      ),
      on_click(msg)
    ]),
    toList([text3(text4)])
  );
}
function success_button(text4, msg) {
  return button(
    toList([
      class$(
        "w-full bg-green-600 hover:bg-green-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider border-2 border-green-500 hover:border-green-600"
      ),
      on_click(msg)
    ]),
    toList([text3(text4)])
  );
}
function failure_button(text4, msg) {
  return button(
    toList([
      class$(
        "w-full bg-red-600 hover:bg-red-700 text-white font-light py-4 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider border-2 border-red-500 hover:border-red-600"
      ),
      on_click(msg)
    ]),
    toList([text3(text4)])
  );
}
function status_panel(title, message, bg_class) {
  return div(
    toList([class$("p-6 " + bg_class + " rounded border")]),
    toList([
      h2(
        toList([
          class$("text-xl font-light text-black mb-2 tracking-wide")
        ]),
        toList([text3(title)])
      ),
      p(
        toList([class$("text-gray-600 text-sm font-light")]),
        toList([text3(message)])
      )
    ])
  );
}
function failure_panel(title, message) {
  return div(
    toList([class$("p-6 bg-red-50 border border-red-200 rounded")]),
    toList([
      h2(
        toList([
          class$(
            "text-xl font-light text-red-800 mb-2 tracking-wide"
          )
        ]),
        toList([text3(title)])
      ),
      p(
        toList([class$("text-red-700 text-sm font-light")]),
        toList([text3(message)])
      )
    ])
  );
}
function orb_selection_button(text4, msg) {
  return button(
    toList([
      class$(
        "w-full bg-purple-600 hover:bg-purple-700 text-white font-light py-3 px-6 rounded transition transform hover:scale-[1.02] text-sm tracking-wider"
      ),
      on_click(msg)
    ]),
    toList([text3(text4)])
  );
}
function number_input(value2) {
  return div(
    toList([class$("mb-4")]),
    toList([
      label(
        toList([
          class$("block text-sm font-light text-gray-700 mb-2"),
          for$("value-input")
        ]),
        toList([text3("Value:")])
      ),
      input(
        toList([
          id("value-input"),
          type_("number"),
          value(value2),
          min2("1"),
          placeholder("Enter a positive number"),
          class$(
            "w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg"
          ),
          on_input((var0) => {
            return new UpdateInputValue(var0);
          })
        ])
      )
    ])
  );
}
function testing_mode_indicator2() {
  return div(
    toList([
      class$("p-2 bg-yellow-50 border border-yellow-200 rounded")
    ]),
    toList([
      p(
        toList([
          class$(
            "text-yellow-700 font-medium text-xs tracking-wider"
          )
        ]),
        toList([text3(testing_mode_indicator)])
      )
    ])
  );
}
function status_effects_display(status_effects) {
  if (status_effects instanceof Empty) {
    return div(toList([class$("h-0")]), toList([]));
  } else {
    let effects = status_effects;
    return div(
      toList([class$("flex flex-wrap gap-2")]),
      map(
        effects,
        (effect_text) => {
          return div(
            toList([
              class$(
                "px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 text-xs font-medium shadow-sm"
              )
            ]),
            toList([text3(effect_text)])
          );
        }
      )
    );
  }
}
function get_orb_style_classes(orb) {
  if (orb instanceof PointOrb) {
    return ["bg-gray-50", "text-gray-700", "border-gray-200"];
  } else if (orb instanceof BombOrb) {
    return ["bg-red-50", "text-red-700", "border-red-200"];
  } else if (orb instanceof HealthOrb) {
    return ["bg-green-50", "text-green-700", "border-green-200"];
  } else if (orb instanceof AllCollectorOrb) {
    return ["bg-purple-50", "text-purple-700", "border-purple-200"];
  } else if (orb instanceof PointCollectorOrb) {
    return ["bg-blue-50", "text-blue-700", "border-blue-200"];
  } else if (orb instanceof BombSurvivorOrb) {
    return ["bg-orange-50", "text-orange-700", "border-orange-200"];
  } else if (orb instanceof MultiplierOrb) {
    return ["bg-yellow-50", "text-yellow-700", "border-yellow-200"];
  } else if (orb instanceof BombImmunityOrb) {
    return ["bg-cyan-50", "text-cyan-700", "border-cyan-200"];
  } else if (orb instanceof ChoiceOrb) {
    return ["bg-indigo-50", "text-indigo-700", "border-indigo-200"];
  } else if (orb instanceof RiskOrb) {
    return ["bg-red-100", "text-red-800", "border-red-300"];
  } else {
    return ["bg-teal-50", "text-teal-700", "border-teal-200"];
  }
}
function choice_panel(title, first_option, second_option, first_msg, second_msg) {
  return div(
    toList([class$("space-y-4")]),
    toList([
      div(
        toList([
          class$(
            "text-sm text-indigo-700 font-medium bg-indigo-50 border border-indigo-200 rounded p-3 text-center"
          )
        ]),
        toList([text3(title)])
      ),
      div(
        toList([class$("grid grid-cols-1 gap-3")]),
        toList([
          button(
            toList([
              class$(
                "bg-indigo-600 hover:bg-indigo-700 text-white font-light py-4 px-6 rounded-lg transition-colors tracking-wide"
              ),
              on_click(first_msg)
            ]),
            toList([text3(first_option)])
          ),
          button(
            toList([
              class$(
                "bg-indigo-600 hover:bg-indigo-700 text-white font-light py-4 px-6 rounded-lg transition-colors tracking-wide"
              ),
              on_click(second_msg)
            ]),
            toList([text3(second_option)])
          )
        ])
      )
    ])
  );
}
function format_duration_for_dev(duration) {
  if (duration instanceof Permanent) {
    return "Permanent";
  } else if (duration instanceof Countdown) {
    let n = duration[0];
    return "Countdown(" + to_string(n) + ")";
  } else {
    let n = duration[0];
    return "Triggered(" + to_string(n) + ")";
  }
}
function format_status_for_dev_display(status) {
  if (status instanceof PointMultiplier) {
    let multiplier = status.multiplier;
    let duration = status.duration;
    return "PointMultiplier(\xD7" + to_string(multiplier) + ", " + format_duration_for_dev(
      duration
    ) + ")";
  } else {
    let duration = status.duration;
    return "BombImmunity(" + format_duration_for_dev(duration) + ")";
  }
}
function render_active_statuses(active_statuses) {
  return div(
    toList([]),
    toList([
      div(
        toList([
          class$(
            "text-xs text-yellow-700 uppercase tracking-wider mb-2 font-light"
          )
        ]),
        toList([text3("ACTIVE STATUS EFFECTS")])
      ),
      div(
        toList([class$("space-y-1")]),
        (() => {
          let $ = is_empty(active_statuses);
          if ($) {
            return toList([
              div(
                toList([class$("text-yellow-600 text-xs")]),
                toList([text3("No active effects")])
              )
            ]);
          } else {
            return map(
              active_statuses,
              (status) => {
                return div(
                  toList([
                    class$("flex items-center text-yellow-800")
                  ]),
                  toList([
                    span(
                      toList([class$("mr-2")]),
                      toList([text3("\u2022")])
                    ),
                    span(
                      toList([class$("font-medium")]),
                      toList([text3(format_status_for_dev_display(status))])
                    )
                  ])
                );
              }
            );
          }
        })()
      )
    ])
  );
}
function format_orb_for_dev_display(orb) {
  if (orb instanceof PointOrb) {
    let value2 = orb[0];
    return "Point(" + to_string(value2) + ")";
  } else if (orb instanceof BombOrb) {
    let value2 = orb[0];
    return "Bomb(" + to_string(value2) + ")";
  } else if (orb instanceof HealthOrb) {
    let value2 = orb[0];
    return "Health(" + to_string(value2) + ")";
  } else if (orb instanceof AllCollectorOrb) {
    let value2 = orb[0];
    return "AllCollector(" + to_string(value2) + ")";
  } else if (orb instanceof PointCollectorOrb) {
    let value2 = orb[0];
    return "PointCollector(" + to_string(value2) + ")";
  } else if (orb instanceof BombSurvivorOrb) {
    let value2 = orb[0];
    return "BombSurvivor(" + to_string(value2) + ")";
  } else if (orb instanceof MultiplierOrb) {
    return "Multiplier";
  } else if (orb instanceof BombImmunityOrb) {
    return "BombImmunity";
  } else if (orb instanceof ChoiceOrb) {
    return "Choice";
  } else if (orb instanceof RiskOrb) {
    return "Risk";
  } else {
    return "PointRecovery";
  }
}
function render_choice_mode_info(choice_orb_1, choice_orb_2) {
  return div(
    toList([]),
    toList([
      div(
        toList([
          class$(
            "text-xs text-yellow-700 uppercase tracking-wider mb-2 font-light"
          )
        ]),
        toList([text3("CHOICE MODE ACTIVE")])
      ),
      div(
        toList([class$("space-y-1")]),
        toList([
          (() => {
            if (choice_orb_1 instanceof Some) {
              let orb = choice_orb_1[0];
              return div(
                toList([class$("flex items-center text-yellow-800")]),
                toList([
                  span(
                    toList([class$("mr-2 font-medium")]),
                    toList([text3("A:")])
                  ),
                  span(
                    toList([class$("font-medium")]),
                    toList([text3(format_orb_for_dev_display(orb))])
                  )
                ])
              );
            } else {
              return div(
                toList([class$("text-yellow-600")]),
                toList([text3("A: No orb")])
              );
            }
          })(),
          (() => {
            if (choice_orb_2 instanceof Some) {
              let orb = choice_orb_2[0];
              return div(
                toList([class$("flex items-center text-yellow-800")]),
                toList([
                  span(
                    toList([class$("mr-2 font-medium")]),
                    toList([text3("B:")])
                  ),
                  span(
                    toList([class$("font-medium")]),
                    toList([text3(format_orb_for_dev_display(orb))])
                  )
                ])
              );
            } else {
              return div(
                toList([class$("text-yellow-600")]),
                toList([text3("B: No orb")])
              );
            }
          })()
        ])
      )
    ])
  );
}
function render_pulled_orbs_log(pulled_orbs) {
  return div(
    toList([]),
    toList([
      div(
        toList([
          class$(
            "text-xs text-yellow-700 uppercase tracking-wider mb-2 font-light"
          )
        ]),
        toList([text3("EXTRACTION LOG")])
      ),
      div(
        toList([class$("space-y-1 max-h-32 overflow-y-auto")]),
        index_map(
          pulled_orbs,
          (orb, index4) => {
            return div(
              toList([class$("flex items-center text-yellow-800")]),
              toList([
                span(
                  toList([class$("mr-2 w-6 text-right")]),
                  toList([
                    text3(
                      to_string(length(pulled_orbs) - index4) + "."
                    )
                  ])
                ),
                span(
                  toList([class$("font-medium")]),
                  toList([text3(format_orb_for_dev_display(orb))])
                )
              ])
            );
          }
        )
      )
    ])
  );
}
function render_container_contents(bag) {
  return div(
    toList([]),
    toList([
      div(
        toList([
          class$(
            "text-xs text-yellow-700 uppercase tracking-wider mb-2 font-light"
          )
        ]),
        toList([text3("CONTAINER CONTENTS")])
      ),
      div(
        toList([class$("space-y-1 max-h-32 overflow-y-auto")]),
        index_map(
          bag,
          (orb, index4) => {
            return div(
              toList([class$("flex items-center text-yellow-800")]),
              toList([
                span(
                  toList([class$("mr-2 w-6 text-right")]),
                  toList([text3(to_string(index4 + 1) + ".")])
                ),
                span(
                  toList([class$("font-medium")]),
                  toList([text3(format_orb_for_dev_display(orb))])
                )
              ])
            );
          }
        )
      )
    ])
  );
}
function render_dev_mode_content(screen, bag, choice_orb_1, choice_orb_2, active_statuses, pulled_orbs) {
  let _block;
  let $ = is_empty(active_statuses);
  if ($) {
    _block = toList([]);
  } else {
    _block = toList([
      render_active_statuses(active_statuses),
      div(
        toList([class$("mt-3 pt-3 border-t border-yellow-300")]),
        toList([])
      )
    ]);
  }
  let status_section = _block;
  let _block$1;
  if (screen instanceof Testing) {
    let $12 = screen[0];
    if ($12 instanceof TestingChoosing) {
      _block$1 = toList([
        render_choice_mode_info(choice_orb_1, choice_orb_2),
        div(
          toList([class$("mt-3 pt-3 border-t border-yellow-300")]),
          toList([])
        )
      ]);
    } else {
      _block$1 = toList([]);
    }
  } else if (screen instanceof Game) {
    let $12 = screen[0];
    if ($12 instanceof Choosing) {
      _block$1 = toList([
        render_choice_mode_info(choice_orb_1, choice_orb_2),
        div(
          toList([class$("mt-3 pt-3 border-t border-yellow-300")]),
          toList([])
        )
      ]);
    } else {
      _block$1 = toList([]);
    }
  } else {
    _block$1 = toList([]);
  }
  let choice_section = _block$1;
  let _block$2;
  let $1 = is_empty(pulled_orbs);
  if ($1) {
    _block$2 = toList([]);
  } else {
    _block$2 = toList([
      render_pulled_orbs_log(pulled_orbs),
      div(
        toList([class$("mt-3 pt-3 border-t border-yellow-300")]),
        toList([])
      )
    ]);
  }
  let pulled_orbs_section = _block$2;
  let container_section = toList([render_container_contents(bag)]);
  return fragment2(
    (() => {
      let _pipe = status_section;
      let _pipe$1 = append(_pipe, choice_section);
      let _pipe$2 = append(_pipe$1, pulled_orbs_section);
      return append(_pipe$2, container_section);
    })()
  );
}
function dev_mode_panel(enabled, bag, screen, choice_orb_1, choice_orb_2, active_statuses, pulled_orbs) {
  let _block;
  if (enabled) {
    _block = toList([
      div(
        toList([
          class$(
            "mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded font-mono text-xs w-64"
          )
        ]),
        toList([
          render_dev_mode_content(
            screen,
            bag,
            choice_orb_1,
            choice_orb_2,
            active_statuses,
            pulled_orbs
          )
        ])
      )
    ]);
  } else {
    _block = toList([]);
  }
  let dev_display = _block;
  return div(
    toList([class$("fixed top-4 right-4 z-50")]),
    prepend(
      button(
        toList([
          class$(
            (() => {
              if (enabled) {
                return "bg-yellow-600 hover:bg-yellow-700 text-white font-mono text-xs py-2 px-3 rounded border-2 border-yellow-500";
              } else {
                return "bg-gray-600 hover:bg-gray-700 text-white font-mono text-xs py-2 px-3 rounded border-2 border-gray-500";
              }
            })()
          ),
          on_click(new ToggleDevMode())
        ]),
        toList([
          text3(
            (() => {
              if (enabled) {
                return "DEV ON";
              } else {
                return "DEV OFF";
              }
            })()
          )
        ])
      ),
      dev_display
    )
  );
}
function risk_orbs_display(risk_orbs) {
  return div(
    toList([
      class$(
        "p-4 bg-red-50 border border-red-200 rounded text-center"
      )
    ]),
    toList([
      div(
        toList([
          class$(
            "text-sm text-red-700 uppercase tracking-wider mb-3 font-light"
          )
        ]),
        toList([text3("YOUR DESTINY AWAITS")])
      ),
      div(
        toList([class$("grid grid-cols-5 gap-2")]),
        index_map(
          risk_orbs,
          (orb, index4) => {
            let $ = get_orb_style_classes(orb);
            let bg_class = $[0];
            let text_class = $[1];
            let border_class = $[2];
            return div(
              toList([
                class$(
                  "p-2 rounded text-xs text-center " + bg_class + " " + text_class + " border " + border_class
                )
              ]),
              toList([
                div(
                  toList([class$("font-bold mb-1")]),
                  toList([text3(to_string(index4 + 1))])
                ),
                div(
                  toList([class$("text-xs")]),
                  toList([text3(orb_display_name(orb))])
                )
              ])
            );
          }
        )
      )
    ])
  );
}
function risk_orbs_progress_display(all_risk_orbs, remaining_risk_orbs) {
  let completed_count = length(all_risk_orbs) - length(
    remaining_risk_orbs
  );
  return div(
    toList([
      class$(
        "p-4 bg-red-50 border border-red-200 rounded text-center"
      )
    ]),
    toList([
      div(
        toList([
          class$(
            "text-sm text-red-700 uppercase tracking-wider mb-3 font-light"
          )
        ]),
        toList([text3("YOUR DESTINY AWAITS")])
      ),
      div(
        toList([class$("grid grid-cols-5 gap-2")]),
        index_map(
          all_risk_orbs,
          (orb, index4) => {
            let is_completed = index4 < completed_count;
            let _block;
            if (is_completed) {
              _block = ["bg-gray-200", "text-gray-400", "border-gray-300"];
            } else {
              _block = get_orb_style_classes(orb);
            }
            let $ = _block;
            let bg_class = $[0];
            let text_class = $[1];
            let border_class = $[2];
            return div(
              toList([
                class$(
                  "p-2 rounded text-xs text-center transition-colors " + bg_class + " " + text_class + " border " + border_class + (() => {
                    if (is_completed) {
                      return " opacity-50";
                    } else {
                      return "";
                    }
                  })()
                )
              ]),
              toList([
                div(
                  toList([class$("font-bold mb-1")]),
                  toList([text3(to_string(index4 + 1))])
                ),
                div(
                  toList([class$("text-xs")]),
                  toList([text3(orb_display_name(orb))])
                )
              ])
            );
          }
        )
      )
    ])
  );
}
function risk_extract_button(is_disabled) {
  return button(
    toList([
      class$(
        (() => {
          if (is_disabled) {
            return "bg-gray-400 text-gray-600 font-light py-4 px-6 rounded-lg w-full cursor-not-allowed";
          } else {
            return "bg-red-600 hover:bg-red-700 text-white font-light py-4 px-6 rounded-lg transition-colors tracking-wide w-full";
          }
        })()
      ),
      disabled(is_disabled),
      on_click(new PullRiskOrb())
    ]),
    toList([text3("EXTRACT FROM VOID")])
  );
}
function risk_effects_summary(risk_effects) {
  return div(
    toList([
      class$("p-4 bg-green-50 border border-green-200 rounded")
    ]),
    toList([
      div(
        toList([
          class$(
            "text-sm text-green-700 uppercase tracking-wider mb-3 font-light"
          )
        ]),
        toList([text3("ACCUMULATED EFFECTS")])
      ),
      div(
        toList([class$("space-y-2")]),
        toList([
          (() => {
            let $ = risk_effects.health_gained > 0;
            if ($) {
              return div(
                toList([class$("text-green-800")]),
                toList([
                  text3(
                    "\u25C7 SYSTEMS RESTORED: +" + to_string(
                      risk_effects.health_gained
                    )
                  )
                ])
              );
            } else {
              return div(toList([]), toList([]));
            }
          })(),
          (() => {
            let $ = risk_effects.damage_taken > 0;
            if ($) {
              return div(
                toList([class$("text-red-800")]),
                toList([
                  text3(
                    "\u25CB HAZARD DAMAGE: -" + to_string(
                      risk_effects.damage_taken
                    )
                  )
                ])
              );
            } else {
              return div(toList([]), toList([]));
            }
          })(),
          (() => {
            let $ = risk_effects.points_gained > 0;
            if ($) {
              return div(
                toList([class$("text-green-800")]),
                toList([
                  text3(
                    "\u25CF ENHANCED DATA: +" + to_string(
                      risk_effects.points_gained
                    )
                  )
                ])
              );
            } else {
              return div(toList([]), toList([]));
            }
          })(),
          (() => {
            let $ = is_empty(risk_effects.special_orbs);
            if ($) {
              return div(toList([]), toList([]));
            } else {
              return div(
                toList([class$("text-green-800")]),
                toList([
                  text3(
                    "\u25C8 SPECIAL EFFECTS: " + to_string(
                      length(risk_effects.special_orbs)
                    ) + " activated"
                  )
                ])
              );
            }
          })()
        ])
      )
    ])
  );
}

// build/dev/javascript/newmoon/view.mjs
function render_game_stats(health, points, milestone, level) {
  return stats_grid(
    toList([
      stat_card(
        "\u25CB",
        systems_label,
        to_string(health),
        "text-black"
      ),
      stat_card(
        "\u25CF",
        data_label,
        to_string(points),
        "text-gray-700"
      ),
      stat_card(
        "\u25CE",
        target_label,
        to_string(milestone),
        "text-gray-600"
      ),
      stat_card(
        "\u25C9",
        sector_label,
        to_string(level),
        "text-gray-500"
      )
    ])
  );
}
function render_main_menu_view() {
  return fragment2(
    toList([
      status_panel(
        "MISSION BRIEFING",
        main_menu_subtitle,
        "bg-blue-50 border-blue-200"
      ),
      primary_button(start_game_button_text, new StartGame()),
      orb_selection_button(
        orb_testing_button_text,
        new GoToOrbTesting()
      )
    ])
  );
}
function render_orb_testing_view() {
  return fragment2(
    toList([
      status_panel(
        orb_testing_title,
        orb_testing_subtitle,
        "bg-purple-50 border-purple-200"
      ),
      orb_selection_button(
        "Data Sample",
        new SelectOrbType(new DataSample())
      ),
      orb_selection_button(
        "Hazard Sample",
        new SelectOrbType(new HazardSample())
      ),
      orb_selection_button(
        "Health Sample",
        new SelectOrbType(new HealthSample())
      ),
      orb_selection_button(
        "Multiplier Sample",
        new SelectOrbType(new MultiplierSample())
      ),
      orb_selection_button(
        "All Collector Sample",
        new SelectOrbType(new AllCollectorSample())
      ),
      orb_selection_button(
        "Point Collector Sample",
        new SelectOrbType(new PointCollectorSample())
      ),
      orb_selection_button(
        "Bomb Survivor Sample",
        new SelectOrbType(new BombSurvivorSample())
      ),
      orb_selection_button(
        "Shield Generator Sample",
        new SelectOrbType(new BombImmunitySample())
      ),
      orb_selection_button(
        "Choice Portal Sample",
        new SelectOrbType(new ChoiceSample())
      ),
      orb_selection_button(
        "Fate Sample",
        new SelectOrbType(new RiskSample())
      ),
      orb_selection_button(
        "Point Recovery Sample",
        new SelectOrbType(new PointRecoverySample())
      ),
      orb_selection_button(
        "Both Status Effects",
        new StartTestingWithBothStatuses()
      ),
      orb_selection_button(
        "Triple Choice Test",
        new StartTestingWithTripleChoice()
      ),
      orb_selection_button(
        "Risk Success Test",
        new StartTestingRiskSuccess()
      ),
      orb_selection_button(
        "Risk Failure Test",
        new StartTestingRiskFailure()
      ),
      orb_selection_button(
        "Risk Continue Test",
        new StartTestingRiskContinue()
      ),
      orb_selection_button(
        "Point Recovery First Test",
        new StartTestingPointRecoveryFirst()
      ),
      orb_selection_button(
        "Point Recovery Active Test",
        new StartTestingPointRecoveryActive()
      ),
      secondary_button(back_to_menu_text, new BackToMainMenu())
    ])
  );
}
function render_orb_value_selection_view(orb_type, input_value) {
  let _block;
  if (orb_type instanceof DataSample) {
    _block = "Data Sample";
  } else if (orb_type instanceof HazardSample) {
    _block = "Hazard Sample";
  } else if (orb_type instanceof HealthSample) {
    _block = "Health Sample";
  } else if (orb_type instanceof MultiplierSample) {
    _block = "Multiplier Sample";
  } else if (orb_type instanceof AllCollectorSample) {
    _block = "All Collector Sample";
  } else if (orb_type instanceof PointCollectorSample) {
    _block = "Point Collector Sample";
  } else if (orb_type instanceof BombSurvivorSample) {
    _block = "Bomb Survivor Sample";
  } else if (orb_type instanceof BombImmunitySample) {
    _block = "Shield Generator Sample";
  } else if (orb_type instanceof ChoiceSample) {
    _block = "Choice Portal Sample";
  } else if (orb_type instanceof RiskSample) {
    _block = "Fate Sample";
  } else {
    _block = "Point Recovery Sample";
  }
  let orb_name = _block;
  let _block$1;
  if (orb_type instanceof DataSample) {
    _block$1 = "Enter the data points this sample will provide";
  } else if (orb_type instanceof HazardSample) {
    _block$1 = "Enter the system damage this sample will cause";
  } else if (orb_type instanceof HealthSample) {
    _block$1 = "Enter the health points this sample will restore";
  } else if (orb_type instanceof MultiplierSample) {
    _block$1 = "Doubles the current point multiplier for all point-awarding samples";
  } else if (orb_type instanceof AllCollectorSample) {
    _block$1 = "Enter points awarded per remaining sample in container";
  } else if (orb_type instanceof PointCollectorSample) {
    _block$1 = "Enter points awarded per data sample left in container";
  } else if (orb_type instanceof BombSurvivorSample) {
    _block$1 = "Enter points awarded per hazard sample encountered so far";
  } else if (orb_type instanceof BombImmunitySample) {
    _block$1 = "Activates hazard shield for 3 extractions, returning hazards to container";
  } else if (orb_type instanceof ChoiceSample) {
    _block$1 = "Presents a choice between two samples from the container";
  } else if (orb_type instanceof RiskSample) {
    _block$1 = "High-risk sample that extracts 5 samples at once with 2\xD7 point bonus if survived";
  } else {
    _block$1 = "Returns the lowest-value data sample back to the container for another chance at points";
  }
  let description = _block$1;
  if (orb_type instanceof DataSample) {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-blue-50 border-blue-200"
        ),
        number_input(input_value),
        primary_button("Confirm Value", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  } else if (orb_type instanceof HazardSample) {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-blue-50 border-blue-200"
        ),
        number_input(input_value),
        primary_button("Confirm Value", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  } else if (orb_type instanceof HealthSample) {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-blue-50 border-blue-200"
        ),
        number_input(input_value),
        primary_button("Confirm Value", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  } else if (orb_type instanceof MultiplierSample) {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-purple-50 border-purple-200"
        ),
        primary_button("Start Test", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  } else if (orb_type instanceof AllCollectorSample) {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-blue-50 border-blue-200"
        ),
        number_input(input_value),
        primary_button("Confirm Value", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  } else if (orb_type instanceof PointCollectorSample) {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-blue-50 border-blue-200"
        ),
        number_input(input_value),
        primary_button("Confirm Value", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  } else if (orb_type instanceof BombSurvivorSample) {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-blue-50 border-blue-200"
        ),
        number_input(input_value),
        primary_button("Confirm Value", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  } else if (orb_type instanceof BombImmunitySample) {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-purple-50 border-purple-200"
        ),
        primary_button("Start Test", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  } else if (orb_type instanceof ChoiceSample) {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-purple-50 border-purple-200"
        ),
        primary_button("Start Test", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  } else if (orb_type instanceof RiskSample) {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-purple-50 border-purple-200"
        ),
        primary_button("Start Test", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  } else {
    return fragment2(
      toList([
        status_panel(
          orb_name + " Configuration",
          description,
          "bg-purple-50 border-purple-200"
        ),
        primary_button("Start Test", new ConfirmOrbValue(orb_type)),
        secondary_button("Back to Selection", new BackToOrbTesting())
      ])
    );
  }
}
function extract_active_status_effects(active_statuses) {
  return map(active_statuses, status_to_display_text);
}
function render_playing_view(last_orb, last_orb_message, bag, active_statuses, _) {
  let orbs_left = length(bag);
  let is_disabled = is_empty(bag);
  let status_effects = extract_active_status_effects(active_statuses);
  return fragment2(
    toList([
      orb_result_display(last_orb, last_orb_message),
      status_effects_display(status_effects),
      container_display(orbs_left),
      extract_button(is_disabled)
    ])
  );
}
function render_won_view(last_orb, last_orb_message, bag, active_statuses, milestone, _) {
  let orbs_left = length(bag);
  let status_effects = extract_active_status_effects(active_statuses);
  let message = data_target_message(milestone);
  return fragment2(
    toList([
      orb_result_display(last_orb, last_orb_message),
      status_effects_display(status_effects),
      container_display(orbs_left),
      success_button(advance_button_text, new NextLevel()),
      status_panel(
        sector_complete_title,
        message,
        "bg-green-50 border-green-200"
      )
    ])
  );
}
function render_lost_view(last_orb, last_orb_message, bag, active_statuses, _) {
  let orbs_left = length(bag);
  let status_effects = extract_active_status_effects(active_statuses);
  return fragment2(
    toList([
      orb_result_display(last_orb, last_orb_message),
      status_effects_display(status_effects),
      container_display(orbs_left),
      failure_button(play_again_text, new RestartGame()),
      failure_panel(
        mission_failed_title,
        mission_failed_message
      )
    ])
  );
}
function render_game_complete_view(last_orb, last_orb_message, bag, active_statuses, _) {
  let orbs_left = length(bag);
  let status_effects = extract_active_status_effects(active_statuses);
  return fragment2(
    toList([
      orb_result_display(last_orb, last_orb_message),
      status_effects_display(status_effects),
      container_display(orbs_left),
      success_button("PLAY AGAIN", new RestartGame()),
      status_panel(
        "MISSION COMPLETE!",
        "ALL FIVE SECTORS CONQUERED! You have successfully completed the deep space exploration mission and mastered the art of sample extraction. Congratulations, Space Explorer!",
        "bg-green-50 border-green-200"
      )
    ])
  );
}
function render_testing_mode_view(last_orb, last_orb_message, bag, active_statuses, _) {
  let orbs_left = length(bag);
  let is_disabled = is_empty(bag);
  let status_effects = extract_active_status_effects(active_statuses);
  return fragment2(
    toList([
      orb_result_display(last_orb, last_orb_message),
      status_effects_display(status_effects),
      container_display(orbs_left),
      extract_button(is_disabled),
      secondary_button(reset_testing_text, new ResetTesting()),
      secondary_button(exit_testing_text, new ExitTesting())
    ])
  );
}
function render_testing_won_view(last_orb, last_orb_message, bag, active_statuses, milestone, _) {
  let orbs_left = length(bag);
  let status_effects = extract_active_status_effects(active_statuses);
  let message = data_target_message(milestone);
  return fragment2(
    toList([
      orb_result_display(last_orb, last_orb_message),
      status_effects_display(status_effects),
      container_display(orbs_left),
      secondary_button("RESTART TESTING", new ResetTesting()),
      secondary_button(exit_testing_text, new ExitTesting()),
      status_panel("TEST COMPLETE", message, "bg-green-50 border-green-200")
    ])
  );
}
function render_testing_lost_view(last_orb, last_orb_message, bag, active_statuses, _) {
  let orbs_left = length(bag);
  let status_effects = extract_active_status_effects(active_statuses);
  return fragment2(
    toList([
      orb_result_display(last_orb, last_orb_message),
      status_effects_display(status_effects),
      container_display(orbs_left),
      secondary_button("RESTART TESTING", new ResetTesting()),
      secondary_button(exit_testing_text, new ExitTesting()),
      failure_panel(
        "TEST FAILED",
        "ALL SYSTEMS COMPROMISED DURING TESTING. ANALYZE RESULTS AND RETRY."
      )
    ])
  );
}
function render_choosing_view(last_orb, last_orb_message, bag, active_statuses, choice_orb_1, choice_orb_2, _) {
  let orbs_left = length(bag);
  let status_effects = extract_active_status_effects(active_statuses);
  if (choice_orb_2 instanceof Some) {
    if (choice_orb_1 instanceof Some) {
      let second_choice = choice_orb_2[0];
      let first_choice = choice_orb_1[0];
      return fragment2(
        toList([
          orb_result_display(last_orb, last_orb_message),
          status_effects_display(status_effects),
          container_display(orbs_left),
          choice_panel(
            "SELECT ONE SAMPLE:",
            orb_display_name(first_choice),
            orb_display_name(second_choice),
            new ChooseOrb(0),
            new ChooseOrb(1)
          )
        ])
      );
    } else {
      return fragment2(
        toList([
          orb_result_display(last_orb, last_orb_message),
          status_effects_display(status_effects),
          container_display(orbs_left),
          failure_panel("CHOICE ERROR", "No choice options available.")
        ])
      );
    }
  } else {
    return fragment2(
      toList([
        orb_result_display(last_orb, last_orb_message),
        status_effects_display(status_effects),
        container_display(orbs_left),
        failure_panel("CHOICE ERROR", "No choice options available.")
      ])
    );
  }
}
function render_testing_choosing_view(last_orb, last_orb_message, bag, active_statuses, choice_orb_1, choice_orb_2, _) {
  let orbs_left = length(bag);
  let status_effects = extract_active_status_effects(active_statuses);
  if (choice_orb_2 instanceof Some) {
    if (choice_orb_1 instanceof Some) {
      let second_choice = choice_orb_2[0];
      let first_choice = choice_orb_1[0];
      return fragment2(
        toList([
          orb_result_display(last_orb, last_orb_message),
          status_effects_display(status_effects),
          container_display(orbs_left),
          choice_panel(
            "SELECT ONE SAMPLE:",
            orb_display_name(first_choice),
            orb_display_name(second_choice),
            new ChooseOrb(0),
            new ChooseOrb(1)
          ),
          secondary_button("RESTART TESTING", new ResetTesting()),
          secondary_button(exit_testing_text, new ExitTesting())
        ])
      );
    } else {
      return fragment2(
        toList([
          orb_result_display(last_orb, last_orb_message),
          status_effects_display(status_effects),
          container_display(orbs_left),
          failure_panel("CHOICE ERROR", "No choice options available."),
          secondary_button("RESTART TESTING", new ResetTesting()),
          secondary_button(exit_testing_text, new ExitTesting())
        ])
      );
    }
  } else {
    return fragment2(
      toList([
        orb_result_display(last_orb, last_orb_message),
        status_effects_display(status_effects),
        container_display(orbs_left),
        failure_panel("CHOICE ERROR", "No choice options available."),
        secondary_button("RESTART TESTING", new ResetTesting()),
        secondary_button(exit_testing_text, new ExitTesting())
      ])
    );
  }
}
function render_risk_accept_view() {
  return fragment2(
    toList([
      status_panel(
        "THE FATES HAVE SPOKEN",
        "A rare Fate Sample has been detected. This sample will extract 5 specimens simultaneously from the container. If you survive all extractions, any data samples will award double points. Do you dare face your destiny?",
        "bg-red-50 border-red-200"
      ),
      primary_button("ACCEPT FATE", new AcceptRisk(true)),
      secondary_button("DECLINE RISK", new AcceptRisk(false))
    ])
  );
}
function render_risk_reveal_view(risk_orbs) {
  return fragment2(
    toList([
      status_panel(
        "BEHOLD YOUR DESTINY",
        "The void has revealed the specimens that await you. Face them one by one, and survive to claim your doubled rewards.",
        "bg-orange-50 border-orange-200"
      ),
      risk_orbs_display(risk_orbs),
      primary_button("FACE THE UNKNOWN", new AcceptFate())
    ])
  );
}
function render_risk_playing_view(last_orb, last_orb_message, risk_orbs, risk_original_orbs, _, _1) {
  let $ = length(risk_orbs);
  let is_disabled = is_empty(risk_orbs);
  return fragment2(
    toList([
      status_panel(
        "RISK MODE ACTIVE",
        "You are in the void. Extract each specimen to survive and claim your enhanced rewards.",
        "bg-red-50 border-red-200"
      ),
      risk_orbs_progress_display(risk_original_orbs, risk_orbs),
      orb_result_display(last_orb, last_orb_message),
      risk_extract_button(is_disabled)
    ])
  );
}
function render_risk_survived_view(risk_accumulated_effects, _) {
  return fragment2(
    toList([
      status_panel(
        "RISK EFFECTS ACCUMULATED",
        "All specimens have been extracted from the void. The accumulated effects await consumption.",
        "bg-orange-50 border-orange-200"
      ),
      risk_effects_summary(risk_accumulated_effects),
      primary_button("CONSUME", new ApplyRiskEffects())
    ])
  );
}
function render_risk_consumed_view(milestone, points) {
  let $ = points >= milestone;
  if ($) {
    return fragment2(
      toList([
        status_panel(
          "YOU SURVIVED THE VOID",
          "The void's power flows through you. Your gamble has paid off with enhanced rewards.",
          "bg-green-50 border-green-200"
        ),
        success_button(
          "CONTINUE MISSION",
          new ContinueAfterRiskConsumption()
        )
      ])
    );
  } else {
    return fragment2(
      toList([
        status_panel(
          "YOU SURVIVED THE VOID",
          "The void's power flows through you. Your survival instincts have kept you alive.",
          "bg-green-50 border-green-200"
        ),
        primary_button(
          "CONTINUE MISSION",
          new ContinueAfterRiskConsumption()
        )
      ])
    );
  }
}
function render_risk_died_view(last_orb, last_orb_message, _) {
  return fragment2(
    toList([
      orb_result_display(last_orb, last_orb_message),
      failure_button("RESTART MISSION", new RestartGame()),
      failure_panel(
        "YOU RISKED OUT",
        "THE VOID CONSUMED YOU. YOUR GAMBLE HAS ENDED IN DARKNESS."
      )
    ])
  );
}
function render_testing_risk_accept_view() {
  return fragment2(
    toList([
      status_panel(
        "THE FATES HAVE SPOKEN",
        "A rare Fate Sample has been detected. This sample will extract 5 specimens simultaneously from the container. If you survive all extractions, any data samples will award double points. Do you dare face your destiny?",
        "bg-red-50 border-red-200"
      ),
      primary_button("ACCEPT RISK", new AcceptRisk(true)),
      secondary_button("DECLINE RISK", new AcceptRisk(false)),
      secondary_button("RESTART TESTING", new ResetTesting()),
      secondary_button(exit_testing_text, new ExitTesting())
    ])
  );
}
function render_testing_risk_reveal_view(risk_orbs) {
  return fragment2(
    toList([
      status_panel(
        "BEHOLD YOUR DESTINY",
        "The void has revealed the specimens that await you. Face them one by one, and survive to claim your doubled rewards.",
        "bg-orange-50 border-orange-200"
      ),
      risk_orbs_display(risk_orbs),
      primary_button("FACE THE UNKNOWN", new AcceptFate()),
      secondary_button("RESTART TESTING", new ResetTesting()),
      secondary_button(exit_testing_text, new ExitTesting())
    ])
  );
}
function render_testing_risk_playing_view(last_orb, last_orb_message, risk_orbs, risk_original_orbs, _, _1) {
  let $ = length(risk_orbs);
  let is_disabled = is_empty(risk_orbs);
  return fragment2(
    toList([
      status_panel(
        "RISK MODE ACTIVE",
        "You are in the void. Extract each specimen to survive and claim your enhanced rewards.",
        "bg-red-50 border-red-200"
      ),
      risk_orbs_progress_display(risk_original_orbs, risk_orbs),
      orb_result_display(last_orb, last_orb_message),
      risk_extract_button(is_disabled)
    ])
  );
}
function render_testing_risk_survived_view(risk_accumulated_effects, _) {
  return fragment2(
    toList([
      status_panel(
        "RISK EFFECTS ACCUMULATED",
        "All specimens have been extracted from the void. The accumulated effects await consumption.",
        "bg-orange-50 border-orange-200"
      ),
      risk_effects_summary(risk_accumulated_effects),
      primary_button("CONSUME", new ApplyRiskEffects()),
      secondary_button("RESTART TESTING", new ResetTesting()),
      secondary_button(exit_testing_text, new ExitTesting())
    ])
  );
}
function render_testing_risk_consumed_view(milestone, points) {
  let $ = points >= milestone;
  if ($) {
    return fragment2(
      toList([
        status_panel(
          "YOU SURVIVED THE VOID",
          "The void's power flows through you. Your gamble has paid off with enhanced rewards.",
          "bg-green-50 border-green-200"
        ),
        success_button("CONTINUE TEST", new ContinueAfterRiskConsumption()),
        secondary_button("RESTART TESTING", new ResetTesting()),
        secondary_button(exit_testing_text, new ExitTesting())
      ])
    );
  } else {
    return fragment2(
      toList([
        status_panel(
          "YOU SURVIVED THE VOID",
          "The void's power flows through you. Your survival instincts have kept you alive.",
          "bg-green-50 border-green-200"
        ),
        primary_button("CONTINUE TEST", new ContinueAfterRiskConsumption()),
        secondary_button("RESTART TESTING", new ResetTesting()),
        secondary_button(exit_testing_text, new ExitTesting())
      ])
    );
  }
}
function render_testing_risk_died_view(last_orb, last_orb_message, _) {
  return fragment2(
    toList([
      orb_result_display(last_orb, last_orb_message),
      secondary_button("RESTART TESTING", new ResetTesting()),
      secondary_button(exit_testing_text, new ExitTesting()),
      failure_panel(
        "YOU RISKED OUT",
        "THE VOID CONSUMED YOU. YOUR GAMBLE HAS ENDED IN DARKNESS."
      )
    ])
  );
}
function view(model) {
  let _block;
  let $ = model.screen;
  if ($ instanceof Menu) {
    _block = app_container(
      game_card(toList([game_header(), render_main_menu_view()]))
    );
  } else if ($ instanceof Testing) {
    let $1 = $[0];
    if ($1 instanceof OrbSelection) {
      _block = app_container(
        game_card(toList([game_header(), render_orb_testing_view()]))
      );
    } else if ($1 instanceof ValueConfiguration) {
      let orb_type = $1[0];
      _block = app_container(
        game_card(
          toList([
            game_header(),
            render_orb_value_selection_view(orb_type, model.input_value)
          ])
        )
      );
    } else if ($1 instanceof Gameplay) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            testing_mode_indicator2(),
            render_game_stats(
              model.health,
              model.points,
              model.milestone,
              model.level
            ),
            render_testing_mode_view(
              model.last_orb,
              model.last_orb_message,
              model.bag,
              model.active_statuses,
              model.pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof Success) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            testing_mode_indicator2(),
            render_game_stats(
              model.health,
              model.points,
              model.milestone,
              model.level
            ),
            render_testing_won_view(
              model.last_orb,
              model.last_orb_message,
              model.bag,
              model.active_statuses,
              model.milestone,
              model.pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof Failure) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            testing_mode_indicator2(),
            render_game_stats(
              model.health,
              model.points,
              model.milestone,
              model.level
            ),
            render_testing_lost_view(
              model.last_orb,
              model.last_orb_message,
              model.bag,
              model.active_statuses,
              model.pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof TestingChoosing) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            testing_mode_indicator2(),
            render_game_stats(
              model.health,
              model.points,
              model.milestone,
              model.level
            ),
            render_testing_choosing_view(
              model.last_orb,
              model.last_orb_message,
              model.bag,
              model.active_statuses,
              model.choice_orb_1,
              model.choice_orb_2,
              model.pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof TestingRiskAccept) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            testing_mode_indicator2(),
            render_testing_risk_accept_view()
          ])
        )
      );
    } else if ($1 instanceof TestingRiskReveal) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            testing_mode_indicator2(),
            render_testing_risk_reveal_view(model.risk_orbs)
          ])
        )
      );
    } else if ($1 instanceof TestingRiskPlaying) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            testing_mode_indicator2(),
            render_testing_risk_playing_view(
              model.last_orb,
              model.last_orb_message,
              model.risk_orbs,
              model.risk_original_orbs,
              model.risk_health,
              model.risk_pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof TestingRiskSurvived) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            testing_mode_indicator2(),
            render_testing_risk_survived_view(
              model.risk_accumulated_effects,
              model.risk_pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof TestingRiskConsumed) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            testing_mode_indicator2(),
            render_testing_risk_consumed_view(model.milestone, model.points)
          ])
        )
      );
    } else {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            testing_mode_indicator2(),
            render_testing_risk_died_view(
              model.last_orb,
              model.last_orb_message,
              model.risk_pulled_orbs
            )
          ])
        )
      );
    }
  } else {
    let $1 = $[0];
    if ($1 instanceof Playing) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            render_game_stats(
              model.health,
              model.points,
              model.milestone,
              model.level
            ),
            render_playing_view(
              model.last_orb,
              model.last_orb_message,
              model.bag,
              model.active_statuses,
              model.pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof Victory) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            render_game_stats(
              model.health,
              model.points,
              model.milestone,
              model.level
            ),
            render_won_view(
              model.last_orb,
              model.last_orb_message,
              model.bag,
              model.active_statuses,
              model.milestone,
              model.pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof Defeat) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            render_game_stats(
              model.health,
              model.points,
              model.milestone,
              model.level
            ),
            render_lost_view(
              model.last_orb,
              model.last_orb_message,
              model.bag,
              model.active_statuses,
              model.pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof GameComplete) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            render_game_stats(
              model.health,
              model.points,
              model.milestone,
              model.level
            ),
            render_game_complete_view(
              model.last_orb,
              model.last_orb_message,
              model.bag,
              model.active_statuses,
              model.pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof Choosing) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            render_game_stats(
              model.health,
              model.points,
              model.milestone,
              model.level
            ),
            render_choosing_view(
              model.last_orb,
              model.last_orb_message,
              model.bag,
              model.active_statuses,
              model.choice_orb_1,
              model.choice_orb_2,
              model.pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof RiskAccept) {
      _block = app_container(
        game_card(toList([game_header(), render_risk_accept_view()]))
      );
    } else if ($1 instanceof RiskReveal) {
      _block = app_container(
        game_card(
          toList([game_header(), render_risk_reveal_view(model.risk_orbs)])
        )
      );
    } else if ($1 instanceof RiskPlaying) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            render_risk_playing_view(
              model.last_orb,
              model.last_orb_message,
              model.risk_orbs,
              model.risk_original_orbs,
              model.risk_health,
              model.risk_pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof RiskSurvived) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            render_risk_survived_view(
              model.risk_accumulated_effects,
              model.risk_pulled_orbs
            )
          ])
        )
      );
    } else if ($1 instanceof RiskConsumed) {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            render_risk_consumed_view(model.milestone, model.points)
          ])
        )
      );
    } else {
      _block = app_container(
        game_card(
          toList([
            game_header(),
            render_risk_died_view(
              model.last_orb,
              model.last_orb_message,
              model.risk_pulled_orbs
            )
          ])
        )
      );
    }
  }
  let main_content = _block;
  return fragment2(
    toList([
      main_content,
      dev_mode_panel(
        model.dev_mode,
        model.bag,
        model.screen,
        model.choice_orb_1,
        model.choice_orb_2,
        model.active_statuses,
        model.pulled_orbs
      )
    ])
  );
}

// build/dev/javascript/newmoon/newmoon.mjs
var FILEPATH = "src/newmoon.gleam";
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
      6,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $, start: 66, end: 174, pattern_start: 77, pattern_end: 82 }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
