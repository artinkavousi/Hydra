export declare const bezier: (input?: import("./bezier-types").BezierArray | import("./bezier-types").BuiltInKeys | ({
    value?: import("./bezier-types").BezierArray | undefined;
} & import("leva/plugin").InputOptions) | ({
    handles: import("./bezier-types").Bezier;
} & {
    type?: import("leva/plugin").LevaInputs | undefined;
} & import("./bezier-types").BezierSettings & import("leva/plugin").InputOptions) | undefined) => import("leva/plugin").CustomInput<import("./bezier-types").InternalBezier>;
