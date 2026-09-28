    (() => {
      const root = document.getElementById('neuratex-direction');
      const chapters = [
        ['01 / Standortbestimmung','Ihre Position<br>in KI-Antworten.','Bei welchen Kauffragen wird Ihr Unternehmen genannt? Wann wird es ausdrücklich empfohlen? Die Auswertung trennt beides.'],
        ['02 / Wettbewerbsvergleich','Welche Anbieter<br>genannt werden.','Sie sehen, welche Wettbewerber in den untersuchten Antworten vorkommen und wie sich Ihre Nennungen und Empfehlungen unterscheiden.'],
        ['03 / Quellenanalyse','Worauf sich<br>Antworten stützen.','Wir dokumentieren die zitierten Quellen, soweit die Systeme sie angeben. Eine Quellenangabe allein erklärt noch nicht die Ursache einer Empfehlung.'],
        ['04 / Prioritäten','Befunde werden<br>zu nächsten Schritten.','Sie erhalten Empfehlungen, die sich auf die Untersuchung stützen. In der Besprechung klären Sie, welche Maßnahmen für Ihr Unternehmen relevant sind.']
      ];
      root.querySelectorAll('[data-chapter-button]').forEach(button => button.addEventListener('click', () => {
        const selected = Number(button.dataset.chapterButton);
        root.querySelector('[data-chapter]').textContent = chapters[selected][0];
        root.querySelector('[data-document-title]').innerHTML = chapters[selected][1];
        root.querySelector('[data-document-copy]').textContent = chapters[selected][2];
        root.querySelectorAll('[data-chapter-button]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      }));
      const state = { headline: 'Markt', density: 'Großzügig' };
      const render = () => {
        root.querySelector('[data-heading]').innerHTML = state.headline === 'Unternehmen'
          ? 'Empfiehlt KI<br><span>Ihr Unternehmen?</span>'
          : 'Welche Anbieter<br>empfiehlt KI<br><span>in Ihrem Markt?</span>';
        root.style.setProperty('--space-16', state.density === 'Kompakt' ? '3rem' : '4rem');
      };
      render();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:root,onChange:render});
        tweak.addSelect(state,'headline',{label:'Headline',options:['Markt','Unternehmen']});
        tweak.addSelect(state,'density',{label:'Abstände',options:['Großzügig','Kompakt']});
      }
    })();
  