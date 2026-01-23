import { Link, type ExternalPathString } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { type ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: ExternalPathString;
  label?: string;
};

export function ExternalLink({ href, label, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== "web") {
          event.preventDefault();
          await WebBrowser.openBrowserAsync(href, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    >
      {label ?? href}
    </Link>
  );
}
