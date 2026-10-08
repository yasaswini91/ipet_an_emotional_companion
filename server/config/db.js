import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? path.join('/tmp', 'ipet_data') : path.join(__dirname, '..', 'data'));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isUsingMongo = false;

// Simple file-backed persistent collections if MongoDB is not running locally
class FileCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]), 'utf-8');
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async find(filter = {}) {
    const items = this._read();
    return items.filter(item => {
      for (const key of Object.keys(filter)) {
        if (filter[key] && typeof filter[key] === 'object' && filter[key].$ne !== undefined) {
          if (item[key] === filter[key].$ne) return false;
        } else if (filter[key] && typeof filter[key] === 'object' && filter[key].$in !== undefined) {
          if (!filter[key].$in.includes(item[key])) return false;
        } else if (filter[key] && typeof filter[key] === 'object' && filter[key].$gt !== undefined) {
          if (new Date(item[key]) <= new Date(filter[key].$gt)) return false;
        } else if (filter[key] && typeof filter[key] === 'object' && filter[key].$lt !== undefined) {
          if (new Date(item[key]) >= new Date(filter[key].$lt)) return false;
        } else if (filter[key] && typeof filter[key] === 'object' && filter[key].$gte !== undefined) {
          if (String(item[key]) < String(filter[key].$gte)) return false;
        } else if (filter[key] && typeof filter[key] === 'object' && filter[key].$lte !== undefined) {
          if (String(item[key]) > String(filter[key].$lte)) return false;
        } else if (item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(filter = {}) {
    const list = await this.find(filter);
    return list.length > 0 ? list[0] : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(doc) {
    const items = this._read();
    const newDoc = {
      _id: doc._id || uuidv4(),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newDoc);
    this._write(items);
    return newDoc;
  }

  async insertMany(docs) {
    const inserted = [];
    for (const doc of docs) {
      inserted.push(await this.create(doc));
    }
    return inserted;
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const items = this._read();
    const idx = items.findIndex(item => item._id === id);
    if (idx === -1) return null;

    const current = items[idx];
    const updateData = update.$set ? { ...current, ...update.$set } : { ...current, ...update };
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        updateData[k] = (updateData[k] || 0) + v;
      }
    }
    updateData.updatedAt = new Date().toISOString();
    items[idx] = updateData;
    this._write(items);
    return options.new ? updateData : current;
  }

  async updateOne(filter, update) {
    const doc = await this.findOne(filter);
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };
    await this.findByIdAndUpdate(doc._id, update);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(filter) {
    const items = this._read();
    const doc = await this.findOne(filter);
    if (!doc) return { deletedCount: 0 };
    const filtered = items.filter(item => item._id !== doc._id);
    this._write(filtered);
    return { deletedCount: 1 };
  }

  async deleteMany(filter) {
    const items = this._read();
    const toDelete = await this.find(filter);
    const toDeleteIds = new Set(toDelete.map(d => d._id));
    const kept = items.filter(item => !toDeleteIds.has(item._id));
    this._write(kept);
    return { deletedCount: toDelete.length };
  }

  async countDocuments(filter = {}) {
    const docs = await this.find(filter);
    return docs.length;
  }
}

const collections = {};
export function getCollection(name) {
  if (!collections[name]) {
    collections[name] = new FileCollection(name);
  }
  return collections[name];
}

export async function connectDB() {
  const mongoURI = process.env.MONGODB_URI;
  if (mongoURI) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${mongoURI}`);
      await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
      isUsingMongo = true;
      console.log('✅ [Database] Successfully connected to MongoDB server');
      return true;
    } catch (err) {
      console.warn('⚠️ [Database] Could not connect to remote MongoDB. Switching seamlessly to Local Persistent JSON Store.');
      isUsingMongo = false;
      return false;
    }
  } else {
    console.log('ℹ️ [Database] MONGODB_URI not set. Using High-Performance Local Persistent JSON Store (data directory: server/data)');
    isUsingMongo = false;
    return false;
  }
}

export function getStorageMode() {
  return isUsingMongo ? 'mongodb' : 'json_file';
}

export { isUsingMongo };
