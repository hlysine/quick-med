import { createFileRoute } from '@tanstack/react-router';
import CalcHeader from '../../components/calculator/CalcHeader';
import Calculator from '../../components/calculator/Calculator';
import CalcTab from '../../components/calculator/CalcTab';
import { useState } from 'react';
import { format, safeCompute } from '../../utils/types';
import CalcNumberInput from '../../components/calculator/CalcNumberInput';
import CalcOutputPanel from '../../components/calculator/CalcOutputPanel';
import CalcOutputEntry from '../../components/calculator/CalcOutputEntry';
import CalcDivider from '../../components/calculator/CalcDivider';

type Sex = 'male' | 'female';
const Sexes = ['male', 'female'] as Sex[];

function CreatinineClearance() {
  const [creatinine, setCreatinine] = useState<number>(Number.NaN);
  const [age, setAge] = useState<number>(Number.NaN);
  const [weight, setWeight] = useState<number>(Number.NaN);
  const [height, setHeight] = useState<number>(Number.NaN);
  const [sex, setSex] = useState<Sex>('male');

  const cockcroftGault = safeCompute(
    (creatinine, age, weight) => {
      return (
        ((140 - age) * weight * (sex === 'female' ? 0.85 : 1)) /
        (72 * (creatinine / 88.4))
      );
    },
    [creatinine, age, weight]
  );

  const salazarCorcoran = safeCompute(
    (creatinine, age, weight, height) => {
      creatinine = creatinine / 88.4;
      height = height / 100;
      if (sex === 'female') {
        return (
          ((146 - age) * (0.287 * weight + 9.74 * height * height)) /
          (60 * creatinine)
        );
      }
      return (
        ((137 - age) * (0.285 * weight + 12.1 * height * height)) /
        (51 * creatinine)
      );
    },
    [creatinine, age, weight, height]
  );

  const idealBodyWeight = safeCompute(
    height => {
      if (sex === 'female') {
        return 45.5 + 0.91 * (height - 152.4);
      }
      return 50 + 0.91 * (height - 152.4);
    },
    [height]
  );

  const weightRatio = safeCompute(
    (weight, idealBodyWeight) => {
      if (idealBodyWeight <= 0) {
        return Number.NaN;
      }
      return weight / idealBodyWeight;
    },
    [weight, idealBodyWeight]
  );

  return (
    <Calculator>
      <CalcHeader title="Creatinine Clearance" id="creatinine-clearance" />
      <CalcDivider>Results</CalcDivider>
      <CalcOutputPanel>
        <CalcOutputEntry
          topLabel="Cockcroft & Gault"
          prefix="CrCl"
          value={cockcroftGault}
          suffix={'mL/min'}
        />
        <CalcOutputEntry
          topLabel="Salazar & Corcoran"
          prefix="CrCl"
          value={salazarCorcoran}
          suffix={'mL/min'}
          bottomLabel={
            typeof weightRatio === 'number' && weightRatio >= 1.9 ? (
              <>
                TBW/IBW ratio: {format(weightRatio)} ≥ 1.9 - consider Salazar &
                Corcoran formula
              </>
            ) : undefined
          }
        />
      </CalcOutputPanel>
      <CalcDivider>Inputs</CalcDivider>
      <CalcTab
        options={Sexes}
        selected={sex}
        className="capitalize tabs-box"
        onSelect={newSex => {
          if (newSex !== sex) {
            setSex(newSex);
          }
        }}
      />
      <CalcNumberInput
        value={creatinine}
        onChange={value => setCreatinine(value)}
        min={0}
        prefix={'Creatinine'}
        suffix={'µmol/L'}
      />
      <CalcNumberInput
        value={age}
        onChange={value => setAge(value)}
        min={0}
        prefix={'Age'}
      />
      <CalcNumberInput
        value={weight}
        onChange={value => setWeight(value)}
        min={0}
        prefix={'Body weight'}
        suffix={'kg'}
      />
      <CalcNumberInput
        value={height}
        onChange={value => setHeight(value)}
        min={0}
        prefix={'Body height'}
        suffix={'cm'}
        bottomLabel="Optional - for Salazar & Corcoran formula"
      />
    </Calculator>
  );
}

export const Route = createFileRoute('/calc/creatinine-clearance')({
  component: CreatinineClearance,
});
