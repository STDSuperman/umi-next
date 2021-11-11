import lodash from 'https://cdn.skypack.dev/lodash';
import React from 'react';

const config = {
  esm: {},
};

export function rootContainer(container: any, opts: any) {
  return React.createElement(Foo, opts, container);
}

function Foo(props: any) {
  console.log(lodash.get(config));
  return (
    <div>
      <h1>Foo</h1>
      {props.children}
    </div>
  );
}
