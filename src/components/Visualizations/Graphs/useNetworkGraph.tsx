import { IADSApiVisNode, IADSApiVisNodeKey } from '@api';
import * as d3 from 'd3';
import { useCallback, useMemo } from 'react';
import { NetworkHierarchyNode } from './NetworkGraph';

/**
 *
 * @param root
 * @param link_data
 * @param keyToUseAsValue
 * @param radius
 * @param numberOfLabelsToShow
 * @returns  functions used to render network graph elements
 */
export const useNetworkGraph = (
  root: IADSApiVisNode,
  link_data: number[][],
  keyToUseAsValue: IADSApiVisNodeKey,
  radius: number,
  numberOfLabelsToShow: number,
) => {
  const { sizes, citation_counts, read_counts } = useMemo(() => {
    const sizes: number[] = [];
    const citation_counts: number[] = [];
    const read_counts: number[] = [];
    root.children?.forEach((g) => {
      g.children?.forEach((c) => {
        sizes.push(c.size);
        citation_counts.push(c.citation_count);
        read_counts.push(c.read_count);
      });
    });
    return { sizes, citation_counts, read_counts };
  }, [root]);

  // when the ring sizing is by citation, how many labels should be shown?
  const citationLimit = citation_counts[numberOfLabelsToShow] || citation_counts[citation_counts.length - 1];

  // when the ring sizing is by reads, how many labels should be shown?
  const readLimit = read_counts[numberOfLabelsToShow] || read_counts[read_counts.length - 1];

  // function that converts ADDS tree node (root) to hierachical tree node for graph
  const partition = useCallback(
    (data: IADSApiVisNode) => {
      // data to node in tree structure
      const root = d3
        .hierarchy<IADSApiVisNode>(data)
        .sum((d) => (d[keyToUseAsValue] ? (d[keyToUseAsValue] as number) : 0))
        .sort((a, b) => b.data.size - a.data.size); // in all views, always sort by size
      const p = d3.partition<IADSApiVisNode>().size([2 * Math.PI, +root.height + 1])(root); // add x (angle), y (distance) to tree structure
      return p as NetworkHierarchyNode<IADSApiVisNode>;
    },
    [keyToUseAsValue],
  );

  // color function returns color based on domain
  const color = useMemo(() => {
    return d3
      .scaleOrdinal<string>()
      .domain(['0', '1', '2', '3', '4', '5', '6'])
      .range([
        'hsla(282, 60%, 52%, 1)',
        'hsla(349, 61%, 47%, 1)',
        'hsla(26, 95%, 67%, 1)',
        'hsla(152, 60%, 40%, 1)',
        'hsla(193, 64%, 61%, 1)',
        'hsla(220, 70%, 56%, 1)',
        'hsla(250, 50%, 47%, 1)',
      ]);
  }, []);

  // arc function returns a pie data for a tree node
  const arc = useMemo(() => {
    return d3
      .arc<NetworkHierarchyNode<IADSApiVisNode>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5) // padding between segments
      .innerRadius((d) => {
        if (d.depth === 1) {
          return d.y0 * radius + radius / 2;
        }
        return d.y0 * radius;
      })
      .outerRadius((d) => Math.max(d.y1 * radius - 1)); // - 1 for gap
  }, []);

  // function that gives the font size for a tree node based on value
  const occurrencesFontScale = useMemo(() => {
    return d3
      .scaleLog()
      .domain([d3.min(sizes), d3.max(sizes)])
      .range([8, 20]);
  }, [sizes]);

  const citationFontScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([d3.min(citation_counts), d3.max(citation_counts)])
      .range([8, 20]);
  }, [citation_counts]);

  const readFontScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([d3.min(read_counts), d3.max(read_counts)])
      .range([8, 20]);
  }, [read_counts]);

  // function to get font size from node data
  const fontSize = (d: NetworkHierarchyNode<IADSApiVisNode>, key: string) => {
    return key === 'size'
      ? `${occurrencesFontScale(d.value)}px`
      : key === 'citation_count'
      ? `${citationFontScale(d.value)}px`
      : `${readFontScale(d.value)}px`;
  };

  // function that gives the data for path from node to node
  const line = useMemo(() => {
    return d3
      .lineRadial<NetworkHierarchyNode<IADSApiVisNode>>()
      .curve(d3.curveBundle.beta(0.85))
      .radius(radius * 3 - 1) // one is a gap
      .angle((d) => d.x0 + (d.x1 - d.x0) / 2);
  }, []);

  // links weights
  const weights = useMemo(() => link_data.map((l) => l[2]), [link_data]);

  // function that gives the stroke width of a link
  const linkScale = useMemo(() => {
    return d3
      .scalePow()
      .exponent(8)
      .domain([d3.min(weights), d3.max(weights)])
      .range([0.5, 3.5]);
  }, [weights]);

  // function that gives the transform of node label to its proper position
  const labelTransform = useCallback((d: NetworkHierarchyNode<IADSApiVisNode>) => {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = d.y1 * radius + 2; // just outside the circle
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }, []);

  // returns the alignment for label, relative to the circle
  const textAnchor = useCallback((d: NetworkHierarchyNode<IADSApiVisNode>) => {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    if (x < 180) {
      return 'start';
    } else {
      return 'end';
    }
  }, []);

  return {
    partition,
    arc,
    color,
    fontSize,
    line,
    citationLimit,
    readLimit,
    linkScale,
    labelTransform,
    textAnchor,
  };
};
