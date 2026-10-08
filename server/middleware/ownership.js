import { Pet } from '../models/Pet.js';
import { Memory } from '../models/Memory.js';

function idsEqual(a, b) {
  return String(a) === String(b);
}

export async function getOwnedPet(userId, petId) {
  if (!petId) {
    const err = new Error('petId is required');
    err.status = 400;
    throw err;
  }
  const pet = await Pet.findById(petId);
  if (!pet) {
    const err = new Error('Pet not found');
    err.status = 404;
    throw err;
  }
  if (!idsEqual(pet.userId, userId)) {
    const err = new Error('You do not have access to this pet');
    err.status = 403;
    throw err;
  }
  return pet;
}

export function requireOwnedPetParam(paramName = 'petId') {
  return async (req, res, next) => {
    try {
      const petId = req.params[paramName] || req.params.id || req.body.petId;
      const pet = await getOwnedPet(req.user._id, petId);
      req.pet = pet;
      next();
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  };
}

export async function assertOwnedMemory(userId, memoryId) {
  const memory = await Memory.findById(memoryId);
  if (!memory) {
    const err = new Error('Memory not found');
    err.status = 404;
    throw err;
  }
  if (!idsEqual(memory.userId, userId)) {
    const err = new Error('You do not have access to this memory');
    err.status = 403;
    throw err;
  }
  await getOwnedPet(userId, memory.petId);
  return memory;
}
