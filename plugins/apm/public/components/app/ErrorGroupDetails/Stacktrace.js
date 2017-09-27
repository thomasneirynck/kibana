import React, { PureComponent } from 'react';
import CodePreview from '../../shared/CodePreview';
import { Ellipsis } from '../../shared/Icons';
import { units } from '../../../style/variables';

function getCollapsedLibraryFrames(stackframes) {
  return stackframes.reduce((acc, stackframe) => {
    if (stackframe.in_app) {
      return [...acc, stackframe];
    }

    const prevItem = acc[acc.length - 1];
    if (prevItem.in_app) {
      return [...acc, { in_app: false, stackframes: [stackframe] }];
    }

    return [
      ...acc.slice(0, -1),
      { ...prevItem, stackframes: [...prevItem.stackframes, stackframe] }
    ];
  }, []);
}

class Stacktrace extends PureComponent {
  state = {
    libraryframes: {}
  };

  toggle = i =>
    this.setState(({ libraryframes }) => {
      return { libraryframes: { ...libraryframes, [i]: !libraryframes[i] } };
    });

  render() {
    const { stackframes = [] } = this.props;
    if (!stackframes) {
      return <div>No stackframes</div>;
    }

    return (
      <div>
        {getCollapsedLibraryFrames(stackframes).map((item, i) => {
          if (item.in_app) {
            return <CodePreview key={i} stackframe={item} />;
          }

          return (
            <Libraryframes
              key={i}
              visible={this.state.libraryframes[i]}
              stackframes={item.stackframes}
              onClick={() => this.toggle(i)}
            />
          );
        })}
      </div>
    );
  }
}

function Libraryframes({ visible, stackframes, onClick }) {
  return (
    <div>
      <div>
        <a style={{ cursor: 'pointer' }} onClick={onClick}>
          <Ellipsis
            horizontal={visible}
            style={{ marginRight: units.half }}
          />{' '}
          {stackframes.length} library frames
        </a>
      </div>

      <div>
        {visible &&
          stackframes.map((stackframe, i) => (
            <CodePreview key={i} stackframe={stackframe} isLibraryFrame />
          ))}
      </div>
    </div>
  );
}

export default Stacktrace;
