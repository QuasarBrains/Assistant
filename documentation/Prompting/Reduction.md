# Prompt Reduction

We'll discuss how prompt reduction techniques are used throughout the program to minimize the amount of tokens sent to APIs. This is in order to minimize monetary cost to the user, but may come at the cost of human readability of prompts.

## GPT-4 Prompt Reducer

One of the main techniques used is simply by asking GPT-4 to generate a more compact version of any given prompt. This is a technique and prompt devised by [AE Studio](https://ae.studio/same-day-skunkworks), and put to use [here](https://www.promptreducer.com/) in their prompt reducer tool. Fortunately for us, they don't keep this technique a secret, and so we can use this prompt to reduce our own:

> compress the following text in a way that fits in a tweet (ideally) and such that you (GPT-4) can reconstruct the intention of the human who ?wrote text as close as possible to the original intention. This is for yourself. It does not need to be human readable or understandable. Abuse of language mixing, abbreviations, symbols (unicode and emoji), or any other encodings or internal representations is all permissible, as long as it, if pasted in a new inference cycle, will yield near-identical results as the original text:

However, because of the use of this prompt, you may come accross alien runes in the codebase, such as this prompt for generating plans of action:

> 🅰️📄⚙️Umsg+ctx=🗒️💡,💼⮕POA. Ex1:"📧John,🚫🤝Thurs."➡️"POA:📧John, explain abs."💠1:Find JD's 📧💠2:Thurs. meet. purpose💠3:User abs. reason💠4:📧John, explain abs.💠5:📧success?💠6:User, 📧 sent? Ex2:"ℹ️TypeScript?"➡️"POA:ℹ️User on TS"💠1:🌐🔍TS💠2:Top3 🌐💠3:Summary of top3💠4:💡reply to user💠5:Send reply. 🅱️POA⚙️📄💡, keep short, human clear, no Req./Opt. labels. REQUIRED=🔒, OPTIONAL=🔓, plan's skeleton, not steps. Order matters! Not too many/few steps, just right. POA➡️agent tasks. K.I.S.S. principle. No need to parse user msg.

While this is technically human readable, I recommend using something like the following prompt to get it back to a more human readable state:

> Given the following condensed input, that may include language mixing, abbreviations, symbols (unicode and emoji), or other encodings or internal representations, decompress and reconstruct it to match the original intention of the human author as closely as possible. It should be a fully comprehensible, human-readable form of the original text. Only respond with the original text. Accuracy and fidelity to the original's essence are paramount, even if the compressed input isn't easily understandable:

## Drawbacks

While prompt reduction is great for costs, it can have some drawbacks.

### Debugging Implications

The first being the lack of verbosity, which has implications on debugging. Prompt engineering is something that takes a lot of refining to get right, and if you have a prompt that looks like a dystopian cyberpunk text conversation, then it may be difficult to fine tune a given prompt, or fix recurring problems you may have. There are however some ways to combat this. For example, if you're debugging, you can use a combination of the de-summarization prompt described above, and the following prompt to both view the original prompt, and edit in place the compressed one:

> Take the following condensed input, which may include language mixing, abbreviations, symbols (unicode and emoji), or other encodings or internal representations. Apply the following modifications: {Specify modifications here}. The end result should be a revised, yet still condensed form of the original input, now altered as per the requested modifications. The aim is not human readability but the creation of a new compressed directive that maintains the original's essence and incorporates the specified changes

This prompt will basically allow you to specify changes, and modify the compressed prompt in place. That way you can refine the prompt even though it might look a little weird.

Another potential way to mitigate debugging problems is to simply keep track of the original and compressed prompts side-by-side somewhere. I'm not exactly sure how this would work, but it's worth considering having some master file of all of the prompts used, along with their compressed counterparts, that way we can just swap them out if we need to. Might be worth having a module that keeps track of prompts, and having a `compress` setting on the initial assistant config which will use either the human readable or compressed variation of the prompt based on user preferences. Could also potentially default to the value of the `verbose` setting if not applied directly?
