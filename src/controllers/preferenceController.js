import Preference from '../models/preferenceModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Upsert (create or update) preference for a client
// @route   PUT /api/preferences/save
// @access  Private
const upsertPreference = asyncHandler(async (req, res) => {
  const {
    clientId,
    name,
    logo,
    address,
    phoneNumber,
    bagInKg,
    salesBagInKg,
    output,
    stages,
    gstPercentage,
    gstin,
    email,
    placeOfSupply,
    bankName,
    bankAccount,
    bankIfsc,
    bankBranch,
    signature,
    visibleModules,
  } = req.body;

  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error('Mill name is required');
  }

  const update = {
    clientId,
    name: name.trim(),
    logo: logo ?? '',
    address: address?.trim() ?? '',
    phoneNumber: phoneNumber?.trim() ?? '',
    bagInKg: bagInKg ?? 50,
    salesBagInKg: salesBagInKg ?? 25,
    output: Array.isArray(output) ? output.filter(Boolean) : [],
    stages: Array.isArray(stages) ? stages.filter(Boolean) : [],
    gstPercentage: gstPercentage ?? 0,
    gstin: gstin?.trim() ?? '',
    email: email?.trim() ?? '',
    placeOfSupply: placeOfSupply?.trim() ?? '',
    bankName: bankName?.trim() ?? '',
    bankAccount: bankAccount?.trim() ?? '',
    bankIfsc: bankIfsc?.trim() ?? '',
    bankBranch: bankBranch?.trim() ?? '',
    signature: signature ?? '',
    visibleModules: Array.isArray(visibleModules) ? visibleModules.filter(Boolean) : [],
  };

  const preference = await Preference.findOneAndUpdate(
    { clientId },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(preference);
});

// @desc    Get preference for a client (returns first match or null)
// @route   GET /api/preferences?clientId=xxx
// @access  Private
const getPreference = asyncHandler(async (req, res) => {
  const { clientId } = req.query;

  const query = clientId ? { clientId } : {};
  const preference = await Preference.findOne(query).sort({ createdAt: -1 });

  if (!preference) {
    // Return an empty default so the frontend doesn't 404
    return res.json(null);
  }

  res.json(preference);
});

// ── Legacy CRUD kept for backward compatibility ──────────────────────────────

const createPreference = asyncHandler(async (req, res) => {
  const { name, logo, address, phoneNumber, bagInKg, output, stages, gstPercentage, salesBagInKg, clientId } = req.body;

  if (!name) { res.status(400); throw new Error('Name is required'); }

  const preference = new Preference({ name, logo, address, phoneNumber, bagInKg, output: output || [], stages: stages || [], gstPercentage, salesBagInKg, clientId });
  const created = await preference.save();
  res.status(201).json(created);
});

const getPreferences = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  const query = clientId ? { clientId } : {};
  const preferences = await Preference.find(query);
  res.json(preferences);
});

const getPreferenceById = asyncHandler(async (req, res) => {
  const preference = await Preference.findById(req.params.id);
  if (!preference) { res.status(404); throw new Error('Preference not found'); }
  res.json(preference);
});

const updatePreference = asyncHandler(async (req, res) => {
  const { name, logo, address, phoneNumber, bagInKg, output, stages, gstPercentage, salesBagInKg } = req.body;
  const preference = await Preference.findById(req.params.id);
  if (!preference) { res.status(404); throw new Error('Preference not found'); }

  preference.name = name || preference.name;
  preference.logo = logo !== undefined ? logo : preference.logo;
  preference.address = address !== undefined ? address : preference.address;
  preference.phoneNumber = phoneNumber !== undefined ? phoneNumber : preference.phoneNumber;
  preference.bagInKg = bagInKg !== undefined ? bagInKg : preference.bagInKg;
  preference.output = output !== undefined ? output : preference.output;
  preference.stages = stages !== undefined ? stages : preference.stages;
  preference.gstPercentage = gstPercentage !== undefined ? gstPercentage : preference.gstPercentage;
  preference.salesBagInKg = salesBagInKg !== undefined ? salesBagInKg : preference.salesBagInKg;

  const updated = await preference.save();
  res.json(updated);
});

const deletePreference = asyncHandler(async (req, res) => {
  const preference = await Preference.findById(req.params.id);
  if (!preference) { res.status(404); throw new Error('Preference not found'); }
  await preference.deleteOne();
  res.json({ message: 'Preference removed' });
});

export {
  upsertPreference,
  getPreference,
  createPreference,
  getPreferences,
  getPreferenceById,
  updatePreference,
  deletePreference,
};
