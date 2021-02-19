import React, { ComponentType, useCallback, useMemo } from 'react';
import {
  HandleLinkPressFeature,
  ForceResponsiveViewportFeature,
  LinkPressTarget,
  useWebshell,
  FeatureBuilder
} from '@formidable-webview/webshell';
import { StyleProp, ViewStyle } from 'react-native';
import {
  HtmlAttributesDictionary,
  RenderHTMLProps
} from 'react-native-render-html';
import { linkPressTargetToOnDOMLinkPressArgs } from '@native-html/plugins-core';

/**
 * Configuration options for the HTMLIframe component.
 * You can pass those options through `renderersProps.iframe`
 * HTML prop.
 *
 * @public
 */
export interface IframeConfig {
  /**
   * When the iframe attribute width is wider than the contentWidth, scales
   * down the viewport so that it doesn't overflows horizontally.
   *
   * @remarks Although it looks like the eponymous `WebView` prop, it works
   * both on iOS and Android.
   *
   * @defaultvalue false
   */
  scalesPageToFit?: boolean;

  /**
   * When `true`, a stylesheet will be inserted in the `WebView` to remove
   * padding and margins for the `body` element.
   */
  removeBodySpacing?: boolean;

  /**
   * When defined, the provided CSS will be injected in a `style` element.
   */
  injectedCSSStyles?: string;

  /**
   * Any props you'd like to pass to the `WebView` component.
   *
   * @remarks
   * `source` and `javascriptEnabled` will be ignored and overriden.
   */
  webViewProps?: any;
}

/**
 * Props for the HTMLIframe component.
 *
 * @public
 */
export interface HTMLIframeProps<WebViewProps = any> extends IframeConfig {
  /**
   * The `WebView` Component you wish to use.
   */
  WebView: ComponentType<WebViewProps>;

  /**
   * Props to be passed to the `WebView` component;
   */
  webViewProps?: WebViewProps;

  /**
   * The source for the iframe.
   */
  source: { uri?: string; html?: string };

  /**
   * Container style.
   */
  style: StyleProp<ViewStyle>;

  /**
   * Handle link press events.
   */
  onLinkPress?: RenderHTMLProps['onLinkPress'];

  /**
   * Html attributes for this iframe node.
   */
  htmlAttribs: HtmlAttributesDictionary;

  /**
   * When scalesPageToFit is enabled, scales the WebView zoom level to make sure the
   * viewport fits contentWidth.
   */
  scaleFactor: number;
}

interface InjectStyleFeatureOptions {
  css: string;
}

const InjectStyleFeatureOptions = new FeatureBuilder<InjectStyleFeatureOptions>(
  {
    defaultOptions: { css: '' },
    identifier: '@native-html/iframe-strip-body-spacing',
    script: `
function InjectStyleFeature(context) {
  var options = context.options || {},
    css = options.css || "",
    head = document.head || document.getElementsByTagName("head")[0],
    style = document.createElement("style");
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
}`
  }
).build();

const RM_BODY_SPACING_CSS =
  'body{padding: 0 !important; margin: 0 !important;}';

const features = [new HandleLinkPressFeature({ preventDefault: true })];

/**
 * A component to render iframes in react-native-render-html.
 *
 * @public
 */
export default function HTMLIframe({
  WebView,
  webViewProps: userWebViewProps,
  source,
  style,
  onLinkPress,
  scaleFactor,
  injectedCSSStyles,
  removeBodySpacing,
  scalesPageToFit = false
}: HTMLIframeProps) {
  const onDOMLinkPress = useCallback(
    (event: LinkPressTarget) =>
      onLinkPress?.apply(null, linkPressTargetToOnDOMLinkPressArgs(event)),
    [onLinkPress]
  );
  const injectedCss = useMemo(
    () =>
      ((removeBodySpacing && RM_BODY_SPACING_CSS) || '').concat(
        injectedCSSStyles || ''
      ),
    [injectedCSSStyles, removeBodySpacing]
  );
  const assembledFeatures = useMemo(() => {
    const feats = [
      ...features,
      new ForceResponsiveViewportFeature({
        initScale: scalesPageToFit ? scaleFactor : 1,
        maxScale: scalesPageToFit ? scaleFactor : 1,
        minScale: scalesPageToFit ? scaleFactor : 1
      })
    ];
    if (injectedCss) {
      feats.push(
        new InjectStyleFeatureOptions({
          css: injectedCss
        }) as any
      );
    }
    return feats;
  }, [injectedCss, scaleFactor, scalesPageToFit]);
  const webViewProps = useWebshell({
    features: assembledFeatures,
    props: {
      ...userWebViewProps,
      onDOMLinkPress,
      style,
      source,
      testID: 'iframe'
    }
  });
  return React.createElement(WebView, webViewProps);
}
