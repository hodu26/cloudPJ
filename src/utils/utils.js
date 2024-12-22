import classNames from 'classnames';

/**
 * classNames 유틸리티 함수
 * @param {string|object} classNames 동적으로 결합할 클래스 이름
 * @returns {string} 결합된 클래스 이름
 */
export const cn = (...args) => {
  return classNames(...args);
};
