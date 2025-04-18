import type { BezierArray, BezierInput, InternalBezierSettings, InternalBezier, BuiltInKeys } from './bezier-types';
export declare const BuiltIn: Record<BuiltInKeys, BezierArray>;
export declare const normalize: (input?: BezierInput) => {
    value: InternalBezier;
    settings: InternalBezierSettings;
};
export declare const sanitize: (value: any, settings: InternalBezierSettings, prevValue?: any) => InternalBezier;
