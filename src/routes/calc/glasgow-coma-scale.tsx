import { createFileRoute } from '@tanstack/react-router';
import CalcHeader from '../../components/calculator/CalcHeader';
import Calculator from '../../components/calculator/Calculator';
import { useState } from 'react';
import CalcOutputPanel from '../../components/calculator/CalcOutputPanel';
import CalcOutputEntry from '../../components/calculator/CalcOutputEntry';
import CalcDivider from '../../components/calculator/CalcDivider';
import CalcRadioInput from '../../components/calculator/CalcRadioInput';

function GlasgowComaScale() {
  const [eye, setEye] = useState<number>(Number.NaN);
  const [verbal, setVerbal] = useState<number>(Number.NaN);
  const [motor, setMotor] = useState<number>(Number.NaN);

  let totalComputed = 0;
  if (!Number.isNaN(eye)) {
    totalComputed += eye + 1;
  }
  if (!Number.isNaN(verbal)) {
    totalComputed += verbal + 1;
  }
  if (!Number.isNaN(motor)) {
    totalComputed += motor + 1;
  }

  let text = '';
  if (!Number.isNaN(eye)) {
    text += `E${eye + 1} `;
  } else {
    text += 'EX ';
  }
  if (!Number.isNaN(verbal)) {
    text += `V${verbal + 1} `;
  } else {
    text += 'VX ';
  }
  if (!Number.isNaN(motor)) {
    text += `M${motor + 1} `;
  } else {
    text += 'MX ';
  }

  return (
    <Calculator>
      <CalcHeader title="Glasgow Coma Scale" id="glasgow-coma-scale" />
      <CalcDivider>Result</CalcDivider>
      <CalcOutputPanel>
        <CalcOutputEntry
          prefix="GCS"
          value={totalComputed}
          bottomLabel={text}
        />
      </CalcOutputPanel>
      <CalcDivider>Inputs</CalcDivider>
      <CalcRadioInput
        value={eye}
        options={[
          '1 - No response',
          '2 - To pain',
          '3 - To speech',
          '4 - Spontaneous',
        ]}
        onChange={setEye}
        topLabel="Eye opening"
      />
      <CalcRadioInput
        value={verbal}
        options={[
          '1 - No response',
          '2 - Incomprehensible sounds',
          '3 - Inappropriate words',
          '4 - Confused',
          '5 - Oriented',
        ]}
        onChange={setVerbal}
        topLabel="Verbal response"
      />
      <CalcRadioInput
        value={motor}
        options={[
          '1 - No response',
          '2 - Extension to pain',
          '3 - Spastic flexion to pain',
          '4 - Withdrawal from pain',
          '5 - Localizes to pain',
          '6 - Obeys commands',
        ]}
        onChange={setMotor}
        topLabel="Motor response"
      />
    </Calculator>
  );
}

export const Route = createFileRoute('/calc/glasgow-coma-scale')({
  component: GlasgowComaScale,
});
