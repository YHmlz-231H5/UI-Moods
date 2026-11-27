// ============================================================================
// ui-moods · type-level tests
//
// `v-model` is two things: the `modelValue` prop and the `update:modelValue`
// event. A declaration that carries only the prop is a component that cannot
// be bound, and the mistake is invisible until a consumer writes `v-model` in
// a template and their editor says no.
//
// These assertions are checked at compile time, by the same `tsc` run that
// checks the public surface. Each one stops compiling when it is false, so a
// declaration that loses the binding cannot be committed.
//
// They are written out one component at a time rather than through a generic
// helper, because a generic conditional cannot be proven at the point it is
// declared — the compiler has no way to know what it will be once the type
// argument is filled in.
// ============================================================================

import type {
  UMCheckboxGroupProps,
  UMInputProps,
  UMRadioGroupProps,
  UMRateProps,
  UMSliderProps,
  UMSwitchProps,
} from "../vue/components/index.js";
import {
  UMCheckboxGroup,
  UMInput,
  UMRadioGroup,
  UMRate,
  UMSlider,
  UMSwitch,
} from "../vue/components/index.js";

/** Fails to compile unless the condition holds. */
type Expect<T extends true> = T;

/** The event half of `v-model` is declared. */
type Event<C extends abstract new (...args: any) => any> =
  "onUpdate:modelValue" extends keyof InstanceType<C>["$props"] ? true : false;

/** A switch is on or off. */
export type SwitchEvent = Expect<Event<typeof UMSwitch>>;
export type SwitchModelIsBoolean = Expect<
  NonNullable<UMSwitchProps["modelValue"]> extends boolean ? true : false
>;

/** A text control holds a string. */
export type InputEvent = Expect<Event<typeof UMInput>>;
export type InputModelIsString = Expect<
  NonNullable<UMInputProps["modelValue"]> extends string ? true : false
>;

/** A radio group holds the value that is picked. */
export type RadioGroupEvent = Expect<Event<typeof UMRadioGroup>>;
export type RadioGroupModelIsString = Expect<
  NonNullable<UMRadioGroupProps["modelValue"]> extends string ? true : false
>;

/** A checkbox group holds the values that are ticked. */
export type CheckboxGroupEvent = Expect<Event<typeof UMCheckboxGroup>>;
export type CheckboxGroupModelIsArray = Expect<
  NonNullable<UMCheckboxGroupProps["modelValue"]> extends string[] ? true : false
>;

/** A slider holds a number. */
export type SliderEvent = Expect<Event<typeof UMSlider>>;
export type SliderModelIsNumber = Expect<
  NonNullable<UMSliderProps["modelValue"]> extends number ? true : false
>;

/** A rate holds a number. */
export type RateEvent = Expect<Event<typeof UMRate>>;
export type RateModelIsNumber = Expect<
  NonNullable<UMRateProps["modelValue"]> extends number ? true : false
>;
