/**
 * Strips Mantine's styling escape hatches from a component's props.
 * Atom components are closed — all visual variation comes from semantic props.
 */
export type OmitStyling<TProps, TOmit extends string = never> =
    Omit<TProps, 'className' | 'classNames' | 'style' | 'styles' | 'vars' | TOmit>;
