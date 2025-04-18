import { styled, keyframes, useDrag, mergeRefs, debounce, normalizeVector, sanitizeVector, useInputContext, Components, useInputSetters, createPlugin, formatVector } from 'leva/plugin';
import React, { useCallback, useRef, useMemo, useReducer, useState, useEffect } from 'react';
import useMeasure from 'react-use-measure';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}

function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}

const useRange = () => {
  return useCallback((v, size) => size * v, []);
};
const useInvertedRange = () => {
  return useCallback((v, size) => v / size, []);
};

const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;
const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);
const A = (aA1, aA2) => 1.0 - 3.0 * aA2 + 3.0 * aA1;
const B = (aA1, aA2) => 3.0 * aA2 - 6.0 * aA1;
const C = aA1 => 3.0 * aA1;

const calcBezier = (aT, aA1, aA2) => {
  return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
};

const getSlope = (aT, aA1, aA2) => {
  return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
};
const binarySubdivide = (aX, aA, aB, mX1, mX2) => {
  let currentX,
    currentT,
    i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
};
const newtonRaphsonIterate = (aX, aGuessT, mX1, mX2) => {
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const currentSlope = getSlope(aGuessT, mX1, mX2);
    if (currentSlope === 0.0) {
      return aGuessT;
    }
    const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
    aGuessT -= currentX / currentSlope;
  }
  return aGuessT;
};
const LinearEasing = x => {
  return x;
};
const bezier$1 = (mX1, mY1, mX2, mY2) => {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }
  if (mX1 === mY1 && mX2 === mY2) {
    return LinearEasing;
  }

  const sampleValues = new Float32Array(kSplineTableSize);
  for (let i = 0; i < kSplineTableSize; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
  }
  const getTForX = aX => {
    let intervalStart = 0.0;
    let currentSample = 1;
    let lastSample = kSplineTableSize - 1;
    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;
    const initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
    }
  };
  return x => {
    if (x === 0 || x === 1) {
      return x;
    }
    return calcBezier(getTForX(x), mY1, mY2);
  };
};

const Svg = styled('svg', {
  width: '100%',
  height: '$controlWidth',
  marginTop: '$rowGap',
  overflow: 'visible',
  zIndex: 100,
  '> path': {
    stroke: '$highlight3',
    strokeWidth: 2
  },
  g: {
    color: '$accent1',
    '&:hover': {
      color: '$accent3'
    },
    '&:active': {
      color: '$vivid1'
    }
  },
  circle: {
    fill: 'currentColor',
    strokeWidth: 10,
    stroke: 'transparent',
    cursor: 'pointer'
  },
  '> line': {
    stroke: '$highlight1',
    strokeWidth: 2
  },
  '> g > line': {
    stroke: 'currentColor'
  },
  variants: {
    withPreview: {
      true: {
        marginBottom: 0
      },
      false: {
        marginBottom: '$rowGap'
      }
    }
  }
});
const fadeIn = o => keyframes({
  '0%': {
    opacity: 0
  },
  '10%': {
    opacity: 0.8
  },
  '100%': {
    opacity: o
  }
});
const move = keyframes({
  '0%': {
    transform: 'translateX(5%)'
  },
  '100%': {
    transform: 'translateX(95%)'
  }
});
const PreviewSvg = styled('svg', {
  width: '100%',
  overflow: 'visible',
  height: 6,
  '> circle': {
    fill: '$vivid1',
    cy: '50%',
    animation: `${fadeIn(0.3)} 1000ms both`,
    '&:first-of-type': {
      animationName: fadeIn(0.7)
    },
    '&:last-of-type': {
      animationName: move
    }
  }
});
const SyledInnerLabel = styled('div', {
  userSelect: 'none',
  $flexCenter: '',
  height: 14,
  width: 14,
  borderRadius: 7,
  marginRight: '$sm',
  cursor: 'pointer',
  fontSize: '0.8em',
  variants: {
    graph: {
      true: {
        backgroundColor: '$elevation1'
      }
    }
  }
});
const Container = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  alignItems: 'center'
});

const HANDLE_RADIUS = 4;
function Line({
  sx,
  sy,
  cx,
  cy
}) {
  const a = Math.atan2(cy - sy, cx - sx);
  const cxs = cx - HANDLE_RADIUS * Math.cos(a);
  const cys = cy - HANDLE_RADIUS * Math.sin(a);
  return React.createElement("line", {
    x1: cxs,
    y1: cys,
    x2: sx,
    y2: sy
  });
}
function BezierSvg({
  displayValue,
  onUpdate,
  withPreview
}) {
  const r = useRange();
  const ir = useInvertedRange();
  const [ref, {
    width,
    height
  }] = useMeasure();
  const svgRef = useRef(null);
  const handleLeft = useRef(null);
  const handleRight = useRef(null);
  const bounds = useRef();
  const bind = useDrag(({
    xy: [x, y],
    event,
    first,
    memo
  }) => {
    if (first) {
      bounds.current = svgRef.current.getBoundingClientRect();
      memo = [handleLeft.current, handleRight.current].indexOf(event.target);
      if (memo < 0) memo = x - bounds.current.left < width / 2 ? 0 : 1;
      memo *= 2;
    }
    const relX = x - bounds.current.left;
    const relY = y - bounds.current.top;
    onUpdate(v => {
      const newV = [...v];
      newV[memo] = ir(relX, width);
      newV[memo + 1] = 1 - ir(relY, height);
      return newV;
    });
    return memo;
  });
  const {
    x1,
    y1,
    x2,
    y2
  } = displayValue;
  const {
    sx,
    sy,
    ex,
    ey,
    cx1,
    cy1,
    cx2,
    cy2
  } = useMemo(() => ({
    sx: r(0, width),
    sy: r(1, height),
    ex: r(1, width),
    ey: r(0, height),
    cx1: r(x1, width),
    cy1: r(1 - y1, height),
    cx2: r(x2, width),
    cy2: r(1 - y2, height)
  }), [r, x1, y1, x2, y2, width, height]);
  return React.createElement(Svg, _extends({
    ref: mergeRefs([svgRef, ref])
  }, bind(), {
    withPreview: withPreview
  }), React.createElement("line", {
    x1: sx,
    y1: sy,
    x2: ex,
    y2: ey
  }), React.createElement("path", {
    fill: "none",
    d: `M${sx},${sy} C${cx1},${cy1} ${cx2},${cy2} ${ex},${ey}`,
    strokeLinecap: "round"
  }), React.createElement("g", null, React.createElement(Line, {
    sx: sx,
    sy: sy,
    cx: cx1,
    cy: cy1
  }), React.createElement("circle", {
    ref: handleLeft,
    cx: cx1,
    cy: cy1,
    r: HANDLE_RADIUS
  })), React.createElement("g", null, React.createElement(Line, {
    sx: ex,
    sy: ey,
    cx: cx2,
    cy: cy2
  }), React.createElement("circle", {
    ref: handleRight,
    cx: cx2,
    cy: cy2,
    r: HANDLE_RADIUS
  })));
}

const DebouncedBezierPreview = React.memo(({
  value
}) => {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const plotPoints = Array(21).fill(0).map((_, i) => 5 + value.evaluate(i / 20) * 90);
  return React.createElement(PreviewSvg, {
    onClick: forceUpdate
  }, plotPoints.map((p, i) => React.createElement("circle", {
    key: i + Date.now(),
    r: 3,
    cx: `${p}%`,
    style: {
      animationDelay: `${i * 50}ms`
    }
  })), React.createElement("circle", {
    key: Date.now() - 1,
    r: 3,
    style: {
      animationTimingFunction: `cubic-bezier(${value.join(',')})`,
      animationDuration: `${plotPoints.length * 50}ms`
    }
  }));
});
function BezierPreview({
  value
}) {
  const [debouncedValue, set] = useState(value);
  const debounceValue = useMemo(() => debounce(v => set(v), 250), []);
  useEffect(() => void debounceValue(value), [value, debounceValue]);
  return React.createElement(DebouncedBezierPreview, {
    value: debouncedValue
  });
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}

const _excluded = ["handles"];
const abscissasSettings = {
  min: 0,
  max: 1,
  step: 0.01
};
const ordinatesSettings = {
  step: 0.01
};
const defaultSettings = {
  graph: true,
  preview: true
};
const BuiltIn = {
  ease: [0.25, 0.1, 0.25, 1],
  linear: [0, 0, 1, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  'in-out-sine': [0.45, 0.05, 0.55, 0.95],
  'in-out-quadratic': [0.46, 0.03, 0.52, 0.96],
  'in-out-cubic': [0.65, 0.05, 0.36, 1],
  'fast-out-slow-in': [0.4, 0, 0.2, 1],
  'in-out-back': [0.68, -0.55, 0.27, 1.55]
};
const normalize = (input = [0.25, 0.1, 0.25, 1]) => {
  let _ref = typeof input === 'object' && 'handles' in input ? input : {
      handles: input
    },
    {
      handles
    } = _ref,
    _settings = _objectWithoutProperties(_ref, _excluded);
  handles = typeof handles === 'string' ? BuiltIn[handles] : handles;
  const mergedSettings = {
    x1: abscissasSettings,
    y1: ordinatesSettings,
    x2: abscissasSettings,
    y2: ordinatesSettings
  };
  const {
    value: _value,
    settings
  } = normalizeVector(handles, mergedSettings, ['x1', 'y1', 'x2', 'y2']);
  const value = _value;
  value.evaluate = bezier$1(..._value);
  value.cssEasing = `cubic-bezier(${_value.join(',')})`;
  return {
    value,
    settings: _objectSpread2(_objectSpread2(_objectSpread2({}, settings), defaultSettings), _settings)
  };
};
const sanitize = (value, settings, prevValue) => {
  const _value = sanitizeVector(value, settings, prevValue);
  const newValue = _value;
  newValue.evaluate = bezier$1(..._value);
  newValue.cssEasing = `cubic-bezier(${_value.join(',')})`;
  return newValue;
};

const {
  Label,
  Row,
  Vector,
  Select
} = Components;
const optionKeys = ['custom', ...Object.keys(BuiltIn)];
const optionValues = [false, ...Object.values(BuiltIn).map(c => c.toString())];
const selectSettings = {
  keys: optionKeys,
  values: optionValues
};
function SelectBezier({
  value,
  onUpdate
}) {
  const selectValue = useMemo(() => optionValues.find(v => v === value.toString()) || false, [value]);
  const args = {
    type: 'SELECT',
    value: selectValue,
    settings: selectSettings
  };
  const setValue = newValue => newValue && onUpdate(newValue.split(','));
  const select = useInputSetters(_objectSpread2(_objectSpread2({}, args), {}, {
    setValue
  }));
  return React.createElement(Select, {
    value: selectValue,
    displayValue: select.displayValue,
    onUpdate: select.onUpdate,
    settings: selectSettings
  });
}
function Bezier() {
  const {
    label,
    value,
    displayValue,
    settings,
    onUpdate,
    setSettings
  } = useInputContext();
  const {
    graph,
    preview
  } = settings;
  return React.createElement(React.Fragment, null, React.createElement(Row, {
    input: true
  }, React.createElement(Label, null, label), React.createElement(Container, null, React.createElement(SyledInnerLabel, {
    graph: graph,
    onClick: () => setSettings({
      graph: !graph
    })
  }, "\uD835\uDC53"), React.createElement(SelectBezier, {
    value: value,
    onUpdate: onUpdate
  }))), graph && React.createElement(BezierSvg, {
    displayValue: displayValue,
    onUpdate: onUpdate,
    withPreview: preview
  }), preview && React.createElement(Row, null, React.createElement(BezierPreview, {
    value: value
  })), graph && React.createElement(Row, null, React.createElement(Vector, {
    value: displayValue,
    settings: settings,
    onUpdate: onUpdate,
    innerLabelTrim: 2
  })));
}

const bezier = createPlugin({
  normalize,
  sanitize,
  format: (value, settings) => formatVector(value, settings),
  component: Bezier
});

export { bezier };
