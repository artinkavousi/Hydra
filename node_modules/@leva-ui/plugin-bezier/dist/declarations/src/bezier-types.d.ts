import type { LevaInputProps, InternalVectorSettings, MergedInputWithSettings } from 'leva/plugin';
export declare type BuiltInKeys = 'ease' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'in-out-sine' | 'in-out-quadratic' | 'in-out-cubic' | 'fast-out-slow-in' | 'in-out-back';
export declare type BezierArray = [number, number, number, number];
export declare type Bezier = BezierArray | BuiltInKeys;
export declare type BezierSettings = {
    graph?: boolean;
    preview?: boolean;
};
export declare type BezierInput = MergedInputWithSettings<Bezier, BezierSettings, 'handles'>;
export declare type InternalBezier = [number, number, number, number] & {
    evaluate(value: number): number;
    cssEasing: string;
};
export declare type DisplayValueBezier = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};
export declare type InternalBezierSettings = InternalVectorSettings<keyof DisplayValueBezier, (keyof DisplayValueBezier)[], 'array'> & {
    graph: boolean;
    preview: boolean;
};
export declare type BezierProps = LevaInputProps<InternalBezier, InternalBezierSettings, DisplayValueBezier>;
