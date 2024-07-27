import { Field, Label, Switch as HeadlessSwitch} from '@headlessui/react';
import classNames from 'classnames';
import React from 'react';


interface SwitchProps {
  checked: boolean;
  setChecked: (checked: boolean) => void;
  className?: string;
  label?: string;
  labelClassName?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked: checked, setChecked, className, label, labelClassName: labelClass}) => {
  return (
    <Field>
      <div className={classNames("flex items-right", className)}>
        <Label 
            className={classNames("cursor-pointer ml-3 mr-3 mt-2 text-slate-300", labelClass)}
        >{label}</Label>
        <HeadlessSwitch
            checked={checked}
            onChange={setChecked}
            className={`mt-2 ${checked ? 'bg-sky-600' : 'bg-slate-600'
                } cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-600 mr-6`}
        >
            <span
                className={`${checked ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
        </HeadlessSwitch>
      </div>
    </Field>
  );
};