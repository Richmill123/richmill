import mongoose from 'mongoose';

const preferenceSchema = new mongoose.Schema(
  {
    // Each admin client has exactly one preference document
    clientId: {
      type: String,
      index: true,
      // Not strictly required so legacy records without clientId still load
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Base64 data-URL or a hosted image URL
    logo: {
      type: String,
    },

    address: {
      type: String,
      trim: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    // Purchase bag weight in kg
    bagInKg: {
      type: Number,
      required: true,
      min: 0,
      default: 50,
    },

    // Sales bag weight in kg
    salesBagInKg: {
      type: Number,
      min: 0,
      default: 25,
    },

    // Output product types e.g. ["bran", "husk", "broken rice"]
    output: [{ type: String, trim: true }],

    // Processing stage labels e.g. ["Boiling", "Splitting", "Packing"]
    stages: [{ type: String, trim: true }],

    gstPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 5,
    },

    // Authorized signatory signature image (base64 data-URL)
    signature: { type: String },

    // Invoice / billing fields
    gstin:          { type: String, trim: true },
    email:          { type: String, trim: true },
    placeOfSupply:  { type: String, trim: true }, // e.g. "33-TAMIL NADU"
    bankName:       { type: String, trim: true },
    bankAccount:    { type: String, trim: true },
    bankIfsc:       { type: String, trim: true },
    bankBranch:     { type: String, trim: true },

    // Which sidebar modules are visible (empty = all visible)
    visibleModules: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Preference', preferenceSchema);
