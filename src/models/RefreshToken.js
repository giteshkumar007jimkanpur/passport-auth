import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revoked: {
      type: Date,
      default: null,
    },
    replacedByHash: {
      default: null,
      type: String,
    },
    ip: {
      default: null,
      type: String,
    },
    userAgent: {
      default: null,
      type: String,
    },
  },
  { timestamps: false },
);

/** Unique index on tokenhash */
RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });

/** TTL (time to live) index on expiresAt - automatically delete document after a certain time */
RefreshTokenSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  },
);

/** Compound index */
RefreshTokenSchema.index({ user: 1, revoked: 1 }, {});

/** Virtuals for quick checks */

RefreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= (this.expiresAt ? this.expiresAt.getTime() : 0);
});

RefreshTokenSchema.virtual('isActive').get(function () {
  return !this.expiresAt && !this.isExpired;
});

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

export default RefreshToken;
