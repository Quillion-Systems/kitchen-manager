// Metro + react-native-svg-transformer turns every imported `.svg` into a
// React component wrapping react-native-svg's primitives. This ambient
// declaration tells TypeScript the same.
declare module "*.svg" {
  import type React from "react"
  import type { SvgProps } from "react-native-svg"

  const content: React.FC<SvgProps>
  export default content
}
