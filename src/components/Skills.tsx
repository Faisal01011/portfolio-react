import { skills } from '../data/projects';

export default function Skills() {
  return (
    <section id="skills">
      <div className="section-head">
        <div>
          <h2 className="section-title">
            Tech <span>Stack</span>
          </h2>
          <div className="section-sub">// hover the chips</div>
        </div>
      </div>
      <div className="skills-cloud">
        {skills.map((s) => (
          <span key={s} className="skill">
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}
