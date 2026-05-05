import { CharactersSection } from "./story-bible/characters.js";
import { ScenesSection } from "./story-bible/scenes.js";
import { StorySection } from "./story-bible/story.js";
import { ThemesSection } from "./story-bible/themes.js";
import { WorldSection } from "./story-bible/world.js";

export default function StoryBible() {
  return (
    <document title="THE ISLE OF MULGAARD" author="Story Bible — Development Draft">
      <p>
        When a disinherited surveyor discovers that his island kingdom is slowly
        dying — its tides silencing, its crops failing, its ancient sleeping god
        beginning to stir — he must forge an alliance between three feuding noble
        houses before the land itself tears apart. But the only man alive who
        understands what is happening has spent three centuries ensuring it never
        does.
      </p>

      <WorldSection />
      <StorySection />
      <ThemesSection />
      <CharactersSection />
      <ScenesSection />
    </document>
  );
}
