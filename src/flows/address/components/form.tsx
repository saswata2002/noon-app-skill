import { motion } from 'motion/react';
import { duration, easing } from '../../../motion/presets';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { icons } from '../assets';
import { fieldLabels, t, tagLabels, type AddressTag } from '../data';
import { LocationSummary } from './map';
import { OverlayButton } from './primitives';
import { MaskIcon } from '../../../components';
import styles from './form.module.css';
import { ref as tokenRef } from '../../../foundations/tokens';
import { palette } from '../../../foundations/palette';

export interface AddressFormValues {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dialCode: string;
  apartmentNumber: string;
  buildingName: string;
  streetName: string;
  directions: string;
  nickname: string;
  tag: AddressTag;
}

type FieldId = keyof AddressFormValues;
const REQUIRED: FieldId[] = ['apartmentNumber', 'buildingName', 'firstName', 'lastName', 'phoneNumber'];

/** AddressUtils.latlngV2CreateFormValidate */
function validate(v: AddressFormValues) {
  const errors: Partial<Record<FieldId, string>> = {};
  for (const id of REQUIRED) if (!String(v[id] ?? '').trim()) errors[id] = t.address_v2_form_validation_required_field_short;
  return errors;
}

/* ── AddressV2FormInput — floating label (13 → 11px, -12px, 60ms) ── */
function FormInput({
  id,
  label,
  value,
  error,
  onChange,
  onBlur,
  focusSignal,
  renderBefore,
  type = 'text',
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  focusSignal?: number;
  renderBefore?: ReactNode;
  type?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const beforeRef = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);
  const [padLeft, setPadLeft] = useState(12);
  const floating = focused || !!value || !!renderBefore;

  useEffect(() => {
    if (focusSignal) ref.current?.focus({ preventScroll: false });
  }, [focusSignal]);
  useEffect(() => {
    if (renderBefore && beforeRef.current) setPadLeft(beforeRef.current.offsetWidth + 12 * 1.5);
  }, [renderBefore]);

  return (
    <div>
      <div className={styles.inputWrap}>
        <input
          ref={ref}
          id={id}
          type={type}
          className={styles.input}
          data-error={!!error}
          style={{ paddingLeft: padLeft }}
          value={value}
          maxLength={50}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
        />
        {renderBefore && (
          <span ref={beforeRef} className={styles.renderBefore}>
            {renderBefore}
          </span>
        )}
        <label htmlFor={id} className={styles.labelContainer}>
          <motion.span className={styles.labelText} animate={{ fontSize: floating ? 11 : 13, y: floating ? -12 : 0 }} transition={{ duration: 0.06 }}>
            {label}
          </motion.span>
        </label>
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
}

/* ── AddressV2FormHeader ── */
function FormHeader({ title, elevated, onBack }: { title: string; elevated: boolean; onBack?: () => void }) {
  return (
    <motion.div
      className={styles.header}
      animate={{ backgroundColor: elevated ? palette.secondaryBackgroundColor : palette.kitGray97v2, boxShadow: elevated ? `0 5px 20px ${palette.kitGray41Alpha14}` : `0 5px 0px ${palette.kitGray41Alpha0}` }}
      transition={{ duration: duration.medium, ease: easing.inOut }}
    >
      {onBack && (
        <button type="button" className={styles.backWrapper} onClick={onBack} aria-label="Back">
          <span className={styles.back}>
            <MaskIcon src={icons.chevronLeftBlack} size={20} color={tokenRef.palette('black')} />
          </span>
        </button>
      )}
      <span className={styles.title}>{title}</span>
    </motion.div>
  );
}

/* ── AddressV2FormTagSection ── */
function TagSection({ tag, onChange }: { tag: AddressTag; onChange: (t: AddressTag) => void }) {
  const tagIcons: Record<AddressTag, string> = { HOME: icons.homeTag, WORK: icons.officeTag, OTHER: icons.otherTag };
  return (
    <div className={styles.tags}>
      {(['HOME', 'WORK', 'OTHER'] as AddressTag[]).map((id) => {
        const selected = id === tag;
        return (
          <button key={id} type="button" className={styles.tag} data-selected={selected} onClick={() => onChange(id)}>
            <MaskIcon src={tagIcons[id]} size={16} color={selected ? tokenRef.color('textInverse') : tokenRef.color('textBody')} />
            <span className={styles.tagText}>{tagLabels[id]}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * LatLngCreateScreen / LatLngUpdateV2Screen body: AddressV2FormDetailsContainer (header + scroll + Save footer)
 * wrapping the location summary (pin-island card with Edit) and AddressV2LatLngForm.
 */
export function AddressDetailsForm({
  initialValues,
  placeName,
  area,
  onClose,
  onChangeLocation,
  onSubmit,
  startExpandedCustomer,
}: {
  initialValues: AddressFormValues;
  placeName: string;
  area: string;
  onClose: () => void;
  onChangeLocation: () => void;
  onSubmit: (v: AddressFormValues) => Promise<void>;
  startExpandedCustomer?: boolean;
}) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<FieldId, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [elevated, setElevated] = useState(false);
  const [focus, setFocus] = useState<{ id: FieldId; n: number } | null>(null);
  const [customerCollapsed, setCustomerCollapsed] = useState(!!(initialValues.firstName && initialValues.lastName && initialValues.phoneNumber) && !startExpandedCustomer);
  const errors = validate(values);

  // shouldOpenKeyboard → focus apartment number after 200ms
  useEffect(() => {
    const timer = setTimeout(() => setFocus({ id: 'apartmentNumber', n: 1 }), 200 + 350);
    return () => clearTimeout(timer);
  }, []);

  const set = (id: FieldId) => (v: string) => setValues((s) => ({ ...s, [id]: v }));
  const touch = (id: FieldId) => () => setTouched((s) => ({ ...s, [id]: true }));
  const err = (id: FieldId) => (touched[id] ? errors[id] : undefined);
  const labels = fieldLabels[values.tag];

  const submit = async () => {
    setTouched(Object.fromEntries(REQUIRED.map((k) => [k, true])));
    const first = REQUIRED.find((k) => errors[k]);
    if (first) {
      if (first === 'firstName' || first === 'lastName' || first === 'phoneNumber') setCustomerCollapsed(false);
      setTimeout(() => setFocus({ id: first, n: Date.now() }), 30);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldFocus = (id: FieldId) => (focus?.id === id ? focus.n : undefined);

  return (
    <div className={styles.container}>
      <FormHeader title={t.address_v2_address_details} elevated={elevated} onBack={onClose} />
      <div className={`nk-scroll ${styles.scroll}`} onScroll={(e) => setElevated(e.currentTarget.scrollTop > 20)}>
        <div className={styles.content}>
          <LocationSummary variant="SCANNED" placeName={placeName} area={area} onChangePress={onChangeLocation} />
          <div>
            <div className={styles.section}>
              <TagSection tag={values.tag} onChange={(tag) => setValues((s) => ({ ...s, tag }))} />
              <div style={{ height: 10 }} />
              <FormInput id="apartmentNumber" label={labels.unitIdentifier} value={values.apartmentNumber} onChange={set('apartmentNumber')} onBlur={touch('apartmentNumber')} error={err('apartmentNumber')} focusSignal={fieldFocus('apartmentNumber')} />
              <div style={{ height: 10 }} />
              <FormInput id="buildingName" label={labels.propertyName} value={values.buildingName} onChange={set('buildingName')} onBlur={touch('buildingName')} error={err('buildingName')} focusSignal={fieldFocus('buildingName')} />
              <div style={{ height: 10 }} />
              <FormInput id="streetName" label={labels.streetName} value={values.streetName} onChange={set('streetName')} />
              <div style={{ height: 10 }} />
              <FormInput id="directions" label={labels.directions} value={values.directions} onChange={set('directions')} />
              <div style={{ height: 10 }} />
              <FormInput id="nickname" label={labels.addressTitle} value={values.nickname} onChange={set('nickname')} />
            </div>
            <div style={{ height: 12 }} />
            <div className={styles.section}>
              {customerCollapsed ? (
                <button type="button" className={styles.collapsed} onClick={() => setCustomerCollapsed(false)}>
                  <span className={styles.collapsedTexts}>
                    <span className={styles.collapsedTitle}>{t.address_v2_receiver_details_for_address}</span>
                    <span className={styles.collapsedSub}>{`${values.firstName} ${values.lastName}, ${values.dialCode}${values.phoneNumber}`}</span>
                  </span>
                  <MaskIcon src={icons.inputPencil} size={20} color={tokenRef.color('textSecondary')} />
                </button>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.fast, ease: easing.out }}>
                  <div className={styles.mainTitle}>{t.address_v2_receiver_details_for_address}</div>
                  <div className={styles.nameRow}>
                    <div className={styles.nameInput}>
                      <FormInput id="firstName" label={t.address_v2_first_name_field} value={values.firstName} onChange={set('firstName')} onBlur={touch('firstName')} error={err('firstName')} focusSignal={fieldFocus('firstName')} />
                    </div>
                    <div style={{ width: 8 }} />
                    <div className={styles.nameInput}>
                      <FormInput id="lastName" label={t.address_v2_last_name_field} value={values.lastName} onChange={set('lastName')} onBlur={touch('lastName')} error={err('lastName')} focusSignal={fieldFocus('lastName')} />
                    </div>
                  </div>
                  <div style={{ height: 8 }} />
                  <FormInput
                    id="phoneNumber"
                    type="tel"
                    label={t.address_v2_phone_field}
                    value={values.phoneNumber}
                    onChange={set('phoneNumber')}
                    onBlur={touch('phoneNumber')}
                    error={err('phoneNumber')}
                    focusSignal={fieldFocus('phoneNumber')}
                    renderBefore={<span className={styles.dialCode}>{values.dialCode}</span>}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <OverlayButton title={t.save} loading={submitting} onPress={submit} />
      </div>
    </div>
  );
}
