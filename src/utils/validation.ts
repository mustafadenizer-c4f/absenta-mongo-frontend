// src/utils/validation.ts
import * as yup from 'yup';

type LabelFn = (key: string) => string | undefined;

export const createLoginSchema = (t?: LabelFn) => yup.object({
  email: yup
    .string()
    .email(t?.("txtInvalidEmail") || 'Please enter a valid email')
    .required(t?.("txtEmailRequired") || 'Email is required'),
  password: yup
    .string()
    .required(t?.("txtPasswordRequired") || 'Password is required'),
});

export const createPasswordResetSchema = (t?: LabelFn) => yup.object({
  currentPassword: yup
    .string()
    .required(t?.("txtCurrentPasswordRequired") || 'Current password is required'),
  newPassword: yup
    .string()
    .required(t?.("txtNewPasswordRequired") || 'New password is required')
    .min(8, t?.("txtPasswordMinChars") || 'Password must be at least 8 characters')
    .matches(/[A-Z]/, t?.("txtMustUppercase") || 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, t?.("txtMustLowercase") || 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, t?.("txtMustNumber") || 'Password must contain at least one number'),
  confirmPassword: yup
    .string()
    .required(t?.("txtConfirmPasswordRequired") || 'Please confirm your password')
    .oneOf([yup.ref('newPassword')], t?.("txtPasswordsMustMatch") || 'Passwords must match'),
});

export const createLeaveRequestSchema = (t?: LabelFn) => yup.object({
  leaveTypeId: yup.string().required(t?.("txtLeaveTypeRequired") || 'Leave type is required'),
  startDate: yup.date().required(t?.("txtStartDateRequired") || 'Start date is required'),
  endDate: yup.date()
    .required(t?.("txtEndDateRequired") || 'End date is required')
    .min(yup.ref('startDate'), t?.("txtEndDateBeforeStart") || 'End date cannot be before start date'),
  isHalfDay: yup.boolean().default(false),
  halfDayPeriod: yup.string()
    .when('isHalfDay', {
      is: true,
      then: (schema) => schema.oneOf(['morning', 'afternoon'], t?.("txtSelectMorningAfternoon") || 'Please select morning or afternoon').required(t?.("txtHalfDayPeriodRequired") || 'Half-day period is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
  reason: yup.string().max(500, t?.("txtReasonMaxChars") || 'Reason cannot exceed 500 characters'),
  coveringPersonId: yup.string().notRequired(),
});

// Backward-compatible static exports (English defaults)
export const loginSchema = createLoginSchema();
export const passwordResetSchema = createPasswordResetSchema();
export const leaveRequestSchema = createLeaveRequestSchema();
