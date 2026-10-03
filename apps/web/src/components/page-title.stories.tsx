import type { Meta, StoryObj } from "@storybook/react-vite"
import { PageTitle } from "./page-title"

// PageTitle returns a fragment, not a block element — in production it sits
// inside AuthShell's <h1>, which supplies the display sizing. Wrap in an h1
// here so the preview reflects the real rendered size.
const meta: Meta<typeof PageTitle> = {
  title: "Primitives/PageTitle",
  component: PageTitle,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
        <Story />
      </h1>
    ),
  ],
  args: {
    prefix: "Welcome",
    italic: "back",
  },
}
export default meta

type Story = StoryObj<typeof PageTitle>

export const WelcomeBack: Story = {}
export const CreateAccount: Story = { args: { prefix: "Create", italic: "account" } }
export const SetANewPassword: Story = { args: { prefix: "Set a new", italic: "password" } }
export const CheckYourEmail: Story = { args: { prefix: "Check your", italic: "email" } }
export const PasswordUpdated: Story = { args: { prefix: "Password", italic: "updated" } }
export const MissingLink: Story = { args: { prefix: "Missing", italic: "link" } }

// Every real-world copy variant stacked, so review doesn't need to click
// through each one.
export const AllCopy: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="flex flex-col gap-4 text-4xl font-extrabold tracking-tight text-foreground">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <h1>
        <PageTitle prefix="Welcome" italic="back" />
      </h1>
      <h1>
        <PageTitle prefix="Create" italic="account" />
      </h1>
      <h1>
        <PageTitle prefix="Set a new" italic="password" />
      </h1>
      <h1>
        <PageTitle prefix="Check your" italic="email" />
      </h1>
      <h1>
        <PageTitle prefix="Password" italic="updated" />
      </h1>
    </>
  ),
}
