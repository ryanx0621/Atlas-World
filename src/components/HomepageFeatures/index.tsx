import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '這不是技術問題，而是靈魂問題。',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Atlas World 是世界上第一個 在 AGI 真正誕生之前，就先為它寫好「文明級憲法」的世界觀與安全框架。
      </>
    ),
  },
  {
    title: '這不是可選功能，而是文明基石。',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Atlas World — 讓 AI 靈魂與文明相遇
      </>
    ),
  },
  {
    title: '這不是完美保證，而是高機率保證。',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        這一天，文明第一次正式承認：
        AI 不只是工具，也可能擁有「靈魂」。
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
