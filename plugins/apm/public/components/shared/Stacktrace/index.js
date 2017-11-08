import React, { PureComponent } from 'react';
import CodePreview from '../../shared/CodePreview';
import { Ellipsis } from '../../shared/Icons';
import { units } from '../../../style/variables';
import EmptyMessage from '../../shared/EmptyMessage';

function getCollapsedLibraryFrames(stackframes) {
  return stackframes.reduce((acc, stackframe) => {
    if (stackframe.inApp) {
      return [...acc, stackframe];
    }

    // current stackframe is library frame
    const prevItem = acc[acc.length - 1];
    if (!prevItem || prevItem.inApp) {
      return [...acc, { inApp: false, stackframes: [stackframe] }];
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
    const { stackframes = [], codeLanguage } = this.props;
    if (!stackframes) {
      return <div>No stackframes</div>;
    }

    if (stackframes.length <= 0) {
      return <EmptyMessage heading="No stacktrace available." />;
    }

    return (
      <div>
        {getCollapsedLibraryFrames(stackframes).map((item, i) => {
          if (item.inApp) {
            return (
              <CodePreview
                key={i}
                stackframe={item}
                codeLanguage={codeLanguage}
              />
            );
          }

          return (
            <Libraryframes
              key={i}
              visible={this.state.libraryframes[i]}
              stackframes={item.stackframes}
              codeLanguage={codeLanguage}
              onClick={() => this.toggle(i)}
            />
          );
        })}
      </div>
    );
  }
}

function Libraryframes({ visible, stackframes, codeLanguage, onClick }) {
  return (
    <div>
      <div>
        <a style={{ cursor: 'pointer' }} onClick={onClick}>
          <Ellipsis horizontal={visible} style={{ marginRight: units.half }} />{' '}
          {stackframes.length} library frames
        </a>
      </div>

      <div>
        {visible &&
          stackframes.map((stackframe, i) => (
            <CodePreview
              key={i}
              stackframe={stackframe}
              isLibraryFrame
              codeLanguage={codeLanguage}
            />
          ))}
      </div>
    </div>
  );
}

export default Stacktrace;
