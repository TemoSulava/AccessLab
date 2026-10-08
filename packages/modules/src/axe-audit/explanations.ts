const templates:Record<string,{explanation:string;suggestion:string}>={
 'button-name':{explanation:'A button needs an accessible name so assistive technology can communicate its purpose.',suggestion:'Use visible button text or an accurate accessible label. Keep the label aligned with the visible purpose; rerun and test with a keyboard.'},
 'label':{explanation:'A form control needs an associated name that explains what to enter or select.',suggestion:'Prefer a visible label linked with for/id, or another valid naming relationship. Placeholder text is not a durable visible label.'},
 'image-alt':{explanation:'Images need an appropriate text alternative unless they are decorative.',suggestion:'Describe the image’s purpose in alt text; use empty alt for a truly decorative image. Check the surrounding context.'},
 'color-contrast':{explanation:'Text and its background need sufficient contrast in the tested rendering.',suggestion:'Adjust foreground/background colors and inspect all interaction states. Incomplete contrast results require manual review.'},
 'target-size':{explanation:'The automated engine evaluates the target-size criterion using its own size/spacing semantics.',suggestion:'Inspect target size, spacing and applicable WCAG exceptions. Keep separate from AccessLab’s bounding-box heuristic.'},
};
export function explainRule(rule:string,description:string){return templates[rule]??{explanation:description,suggestion:'Inspect the target and follow the official rule guidance. Verify the change in context; no suggested fix is universally correct.'};}
