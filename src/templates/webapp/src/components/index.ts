// TODO: import components
import './SvgDefs/SvgDefs.ts';

// #region HTML only elements
declare global {
	interface HTMLElementTagNameMap {
		// TODO: add HTML only components
		'sr-only': HTMLElement;
		'svg-defs': HTMLElement;
	}
}
// #endregion
