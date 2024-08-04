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
      <div className={classNames("flex items-right items-center", className)}>
        <Label 
            className={classNames("cursor-pointer ml-3 mr-2 text-slate-300 text-md", labelClass)}
        >{label}</Label>
        <HeadlessSwitch
            checked={checked}
            onChange={setChecked}
            className={`${checked ? 'bg-sky-600' : 'bg-slate-600'
                } cursor-pointer relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-600 mr-6`}
        >
            <span
                className={`${checked ? 'translate-x-5' : 'translate-x-1'
                    } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
            />
        </HeadlessSwitch>
      </div>
    </Field>
  );
};