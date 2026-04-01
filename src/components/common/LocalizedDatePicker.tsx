import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr } from 'date-fns/locale/tr';
import { TextField } from '@mui/material';
import { useLanguage } from '../../contexts/LanguageContext';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('tr', tr);

interface LocalizedDatePickerProps {
  label: string;
  value: string; // yyyy-MM-dd string
  onChange: (value: string) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  sx?: any;
}

const LocalizedDatePicker: React.FC<LocalizedDatePickerProps> = ({
  label, value, onChange, size = 'small', fullWidth = false,
  required = false, disabled = false, error = false, helperText, sx,
}) => {
  const { language } = useLanguage();

  const dateValue = React.useMemo(() => {
    if (!value) return null;
    const d = new Date(value + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const handleChange = (date: Date | null) => {
    if (date && !isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    } else {
      onChange('');
    }
  };

  return (
    <DatePicker
      selected={dateValue}
      onChange={handleChange}
      locale={language === 'tr' ? 'tr' : undefined}
      dateFormat={language === 'tr' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
      disabled={disabled}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      yearDropdownItemNumber={80}
      scrollableYearDropdown
      portalId="root"
      customInput={
        <TextField
          label={label}
          size={size}
          fullWidth={fullWidth}
          required={required}
          error={error}
          helperText={helperText}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={sx}
        />
      }
    />
  );
};

export default LocalizedDatePicker;
